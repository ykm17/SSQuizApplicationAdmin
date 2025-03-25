import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Button, Card } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';

const StartScreen = ({ navigation }) => {
  return (
    <LinearGradient colors={['#4c12a1', '#2b076e']} style={styles.container}>
      <View style={styles.starBackground}>
        {[...Array(20)].map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.star, 
              { 
                top: `${Math.random() * 100}%`, 
                left: `${Math.random() * 100}%`,
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
              }
            ]} 
          />
        ))}
      </View>
      
      <View style={styles.logoContainer}>
        <Text style={styles.title}>Welcome to HVAC MCQ Master Admin App!</Text>
      </View>
      
      <View style={styles.cardContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Home')}
              style={styles.button}
              labelStyle={styles.buttonLabel}
              contentStyle={{paddingVertical: 12}}>
              Quiz
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('ArticleScreen')}
              style={styles.articleButton}
              labelStyle={styles.articleButtonLabel}
              contentStyle={{paddingVertical: 8}}
              icon="book-open-variant">
              View Articles
            </Button>
          </Card.Content>
        </Card>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  starBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 10,
    opacity: 0.7,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
  },
  button: {
    backgroundColor: '#FFA500',
    marginBottom: 16,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  articleButton: {
    borderColor: '#6200ee',
    borderWidth: 1.5,
    borderRadius: 10,
  },
  articleButtonLabel: {
    color: '#6200ee',
    fontWeight: '500',
  },
});

export default StartScreen;
