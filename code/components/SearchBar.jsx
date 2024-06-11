import React from 'react';
import { Searchbar } from 'react-native-paper';

const SearchBar = ({ onSearch }) => {
    const [searchQuery, setSearchQuery] = React.useState('');

    const onChangeSearch = query => {
        setSearchQuery(query);
        onSearch(query);
    };

    return <Searchbar placeholder="Search" onChangeText={onChangeSearch} value={searchQuery} />;
};

export default SearchBar;
