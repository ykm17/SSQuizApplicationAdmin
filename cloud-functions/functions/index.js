const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

// Initialize Firebase Admin only if not already initialized
if (getApps().length === 0) {
    initializeApp();
}
const db = getFirestore();
const messaging = getMessaging();

// Cloud Function
exports.sendArticleNotification = onDocumentCreated("articles/{articleId}", async (event) => {
    
    console.log("\nsendArticleNotification ------------------------------> Triggered\n");
    const snapshot = event.data;
    if (!snapshot) {
        console.log("No article data found.");
        return;
    }

    const newArticle = snapshot.data();
    const articleId = event.params.articleId;
    const articleTitle = newArticle.title?.en || "A new article has been added.";
    const articleSubtitle = `Article is about ${articleTitle}`;

    try {
        // Fetch active FCM tokens
        const tokensSnapshot = await db.collection("fcmTokens")
            .where("isActive", "==", true)
            .get();

        if (tokensSnapshot.empty) {
            console.log("No active FCM tokens available.");
            return;
        }

        const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
        if (tokens.length === 0) {
            console.log("No valid FCM tokens found.");
            return;
        }

        // Notification payload
        const payload = {
            notification: {
                title: "New Article Published!",
                body: articleSubtitle,
            },
            data: {
                articleId: articleId,
                title: articleTitle,
                description: newArticle.description?.en || "",
                imageUrl: newArticle.imageUrl || "",
            },
        };

        // Send notification to all valid tokens
        const response = await messaging.sendEachForMulticast({ tokens, ...payload });
        console.log("\nNotification sent successfully to", tokens.length, "devices.\n");

        // Log individual failures
        response.responses.forEach((res, idx) => {
            if (!res.success) {
                console.error(`Error sending to ${tokens[idx]}:`, res.error);
            }
        });
    } catch (error) {
        console.error("Error sending notification:", error);
    }
});