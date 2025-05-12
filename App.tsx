import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  FlatList,
  Linking,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('searchHistory');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveSearchHistory = async (newHistory: SearchHistoryItem[]) => {
    try {
      await AsyncStorage.setItem('searchHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const performSearch = async (text: string) => {
    if (!text) {
      Toast.show({
        type: 'error',
        text1: 'Please enter a search query',
      });
      return;
    }

    setIsSearching(true);
    Keyboard.dismiss();

    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
      await Linking.openURL(searchUrl);

      // Add to history
      const newHistoryItem: SearchHistoryItem = {
        id: Date.now().toString(),
        query: text,
        timestamp: Date.now(),
      };

      const newHistory = [newHistoryItem, ...searchHistory];
      setSearchHistory(newHistory);
      await saveSearchHistory(newHistory);
      setSearchQuery('');

      Toast.show({
        type: 'success',
        text1: 'Searching...',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to open search',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    performSearch(searchQuery);
  };

  const handleSearchAgain = (query: string) => {
    performSearch(query);
  };

  const handleDeleteHistory = (id: string) => {
    const newHistory = searchHistory.filter(item => item.id !== id);
    setSearchHistory(newHistory);
    saveSearchHistory(newHistory);
    Toast.show({
      type: 'info',
      text1: 'Search history item deleted',
    });
  };

  const handleDeleteAll = () => {
    setSearchHistory([]);
    saveSearchHistory([]);
    Toast.show({
      type: 'info',
      text1: 'All search history cleared',
    });
  };

  const renderHistoryItem = ({item}: {item: SearchHistoryItem}) => (
    <View style={[styles.historyItem, isDarkMode && styles.historyItemDark]}>
      <Text style={[styles.historyText, isDarkMode && styles.textDark]}>
        {item.query}
      </Text>
      <View style={styles.historyButtons}>
        <TouchableOpacity
          style={[styles.button, styles.searchAgainButton]}
          onPress={() => handleSearchAgain(item.query)}>
          <Text style={styles.buttonText}>Search Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => handleDeleteHistory(item.id)}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        {backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff'},
      ]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#1a1a1a' : '#ffffff'}
      />
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            isDarkMode && styles.searchInputDark,
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search on Google..."
          placeholderTextColor={isDarkMode ? '#888888' : '#666666'}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[
            styles.searchButton,
            isDarkMode && styles.searchButtonDark,
            isSearching && styles.searchButtonDisabled,
          ]}
          onPress={handleSearch}
          disabled={isSearching}>
          <Text style={styles.searchButtonText}>
            {isSearching ? 'Searching...' : 'Search'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historyHeader}>
        <Text
          style={[
            styles.historyTitle,
            isDarkMode && styles.textDark,
          ]}>
          Search History
        </Text>
        {searchHistory.length > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.deleteAllButton]}
            onPress={handleDeleteAll}>
            <Text style={styles.buttonText}>Delete All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={searchHistory}
        renderItem={renderHistoryItem}
        keyExtractor={item => item.id}
        style={styles.historyList}
      />
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },
  searchInputDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
    color: '#ffffff',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDark: {
    backgroundColor: '#0A84FF',
  },
  searchButtonDisabled: {
    opacity: 0.7,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#ffffff',
  },
  historyItemDark: {
    backgroundColor: '#2a2a2a',
    borderBottomColor: '#444',
  },
  historyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  textDark: {
    color: '#ffffff',
  },
  historyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  searchAgainButton: {
    backgroundColor: '#34C759',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  deleteAllButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default App;
