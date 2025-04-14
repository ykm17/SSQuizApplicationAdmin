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
    const imageUrl = newArticle.imageUrl || "";

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

        // Improved notification payload with proper image handling for both platforms
        const payload = {
          notification: {
            title: "New Article Published!",
            body: articleSubtitle
          },
          data: {
            articleId: articleId,
            title: articleTitle,
            description: newArticle.description?.en || "",
            imageUrl: imageUrl,
            timestamp: Date.now().toString()
          },
          android: {
            notification: {
              imageUrl: imageUrl,
              priority: "high",
              channelId: "default"
            }
          },
          apns: {
            payload: {
              aps: {
                "mutable-content": 1,
                "content-available": 1,
                sound: "default",
                badge: 1,
                alert: {
                  title: "New Article Published!",
                  body: articleSubtitle
                }
              },
              image: imageUrl
            }
          }
        };
        console.log("FCM Payload:");
        console.dir(payload, { depth: null, colors: true });

        // Send notification to all valid tokens
        const response = await messaging.sendEachForMulticast({ tokens, ...payload });
        console.log("\nNotification sent successfully to", tokens.length, "devices.\n");

        // Log individual failures and handle token cleanup
        const failedTokens = [];
        response.responses.forEach((res, idx) => {
            if (!res.success) {
                console.error(`Error sending to ${tokens[idx]}:`, res.error);
                
                // Check if token is invalid and mark for cleanup
                if (res.error.code === 'messaging/invalid-registration-token' || 
                    res.error.code === 'messaging/registration-token-not-registered') {
                    failedTokens.push(tokens[idx]);
                }
            }
        });

        // Update failed tokens in Firestore
        if (failedTokens.length > 0) {
            const batch = db.batch();
            
            // Find and update failed tokens
            const failedTokensSnapshot = await db.collection("fcmTokens")
                .where("token", "in", failedTokens)
                .get();
                
            failedTokensSnapshot.docs.forEach(doc => {
                batch.update(doc.ref, { isActive: false });
            });
            
            await batch.commit();
            console.log(`Marked ${failedTokens.length} invalid tokens as inactive`);
        }
    } catch (error) {
        console.error("Error sending notification:", error);
    }
});