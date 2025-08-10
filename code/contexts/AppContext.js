// Global App Context for managing application state
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getValueFor, save } from '@/services/storage/storage';
import { USER_TYPES, STORAGE_KEYS } from '@/constants/app';
import ErrorHandler from '@/services/errors/ErrorHandler';

// Initial state
const initialState = {
    user: {
        wallet: null,
        userInfo: null,
        userType: null,
        isAuthenticated: false,
    },
    app: {
        isLoading: true,
        error: null,
        networkStatus: 'online',
    },
    blockchain: {
        isConnected: false,
        network: null,
        blockNumber: null,
    },
};

// Action types
const actionTypes = {
    SET_USER_WALLET: 'SET_USER_WALLET',
    SET_USER_INFO: 'SET_USER_INFO',
    SET_USER_TYPE: 'SET_USER_TYPE',
    SET_AUTHENTICATED: 'SET_AUTHENTICATED',
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    SET_NETWORK_STATUS: 'SET_NETWORK_STATUS',
    SET_BLOCKCHAIN_STATUS: 'SET_BLOCKCHAIN_STATUS',
    LOGOUT: 'LOGOUT',
    RESET_ERROR: 'RESET_ERROR',
};

// Reducer function
const appReducer = (state, action) => {
    switch (action.type) {
        case actionTypes.SET_USER_WALLET:
            return {
                ...state,
                user: {
                    ...state.user,
                    wallet: action.payload,
                },
            };

        case actionTypes.SET_USER_INFO:
            return {
                ...state,
                user: {
                    ...state.user,
                    userInfo: action.payload,
                },
            };

        case actionTypes.SET_USER_TYPE:
            return {
                ...state,
                user: {
                    ...state.user,
                    userType: action.payload,
                },
            };

        case actionTypes.SET_AUTHENTICATED:
            return {
                ...state,
                user: {
                    ...state.user,
                    isAuthenticated: action.payload,
                },
            };

        case actionTypes.SET_LOADING:
            return {
                ...state,
                app: {
                    ...state.app,
                    isLoading: action.payload,
                },
            };

        case actionTypes.SET_ERROR:
            return {
                ...state,
                app: {
                    ...state.app,
                    error: action.payload,
                },
            };

        case actionTypes.SET_NETWORK_STATUS:
            return {
                ...state,
                app: {
                    ...state.app,
                    networkStatus: action.payload,
                },
            };

        case actionTypes.SET_BLOCKCHAIN_STATUS:
            return {
                ...state,
                blockchain: {
                    ...state.blockchain,
                    ...action.payload,
                },
            };

        case actionTypes.LOGOUT:
            return {
                ...initialState,
                app: {
                    ...initialState.app,
                    isLoading: false,
                },
            };

        case actionTypes.RESET_ERROR:
            return {
                ...state,
                app: {
                    ...state.app,
                    error: null,
                },
            };

        default:
            return state;
    }
};

// Create context
const AppContext = createContext();

// Context provider component
export const AppProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Initialize app on mount
    useEffect(() => {
        initializeApp();
    }, []);

    // Initialize app state from storage
    const initializeApp = async () => {
        try {
            dispatch({ type: actionTypes.SET_LOADING, payload: true });

            // Load user data from storage
            const [wallet, userInfo, userType] = await Promise.all([
                getValueFor(STORAGE_KEYS.WALLET),
                getValueFor(STORAGE_KEYS.USER_INFO),
                getValueFor(STORAGE_KEYS.USER_TYPE),
            ]);

            if (wallet) {
                dispatch({ type: actionTypes.SET_USER_WALLET, payload: wallet });
            }

            if (userInfo) {
                dispatch({ type: actionTypes.SET_USER_INFO, payload: userInfo });
            }

            if (userType) {
                dispatch({ type: actionTypes.SET_USER_TYPE, payload: userType });
            }

            // Set authentication status
            const isAuthenticated = !!(wallet && userInfo);
            dispatch({ type: actionTypes.SET_AUTHENTICATED, payload: isAuthenticated });
        } catch (error) {
            ErrorHandler.logError(error, 'initializeApp');
            dispatch({
                type: actionTypes.SET_ERROR,
                payload: 'Failed to initialize app. Please restart the application.',
            });
        } finally {
            dispatch({ type: actionTypes.SET_LOADING, payload: false });
        }
    };

    // Action creators
    const actions = {
        setUserWallet: async wallet => {
            try {
                await save(STORAGE_KEYS.WALLET, JSON.stringify(wallet));
                dispatch({ type: actionTypes.SET_USER_WALLET, payload: wallet });
            } catch (error) {
                ErrorHandler.logError(error, 'setUserWallet');
                throw error;
            }
        },

        setUserInfo: async userInfo => {
            try {
                await save(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
                dispatch({ type: actionTypes.SET_USER_INFO, payload: userInfo });
            } catch (error) {
                ErrorHandler.logError(error, 'setUserInfo');
                throw error;
            }
        },

        setUserType: async userType => {
            try {
                await save(STORAGE_KEYS.USER_TYPE, JSON.stringify(userType));
                dispatch({ type: actionTypes.SET_USER_TYPE, payload: userType });
            } catch (error) {
                ErrorHandler.logError(error, 'setUserType');
                throw error;
            }
        },

        setAuthenticated: isAuthenticated => {
            dispatch({ type: actionTypes.SET_AUTHENTICATED, payload: isAuthenticated });
        },

        setLoading: isLoading => {
            dispatch({ type: actionTypes.SET_LOADING, payload: isLoading });
        },

        setError: error => {
            dispatch({ type: actionTypes.SET_ERROR, payload: error });
        },

        resetError: () => {
            dispatch({ type: actionTypes.RESET_ERROR });
        },

        setNetworkStatus: status => {
            dispatch({ type: actionTypes.SET_NETWORK_STATUS, payload: status });
        },

        setBlockchainStatus: status => {
            dispatch({ type: actionTypes.SET_BLOCKCHAIN_STATUS, payload: status });
        },

        logout: async () => {
            try {
                // Clear storage
                await Promise.all([
                    save(STORAGE_KEYS.WALLET, null),
                    save(STORAGE_KEYS.USER_INFO, null),
                    save(STORAGE_KEYS.USER_TYPE, null),
                ]);

                dispatch({ type: actionTypes.LOGOUT });
            } catch (error) {
                ErrorHandler.logError(error, 'logout');
                throw error;
            }
        },

        // Computed getters
        isAdmin: () => {
            return state.user.userType?.type === USER_TYPES.ADMIN;
        },

        isGuest: () => {
            return state.user.userType?.type === USER_TYPES.GUEST;
        },

        hasWallet: () => {
            return !!state.user.wallet?.address;
        },
    };

    // Context value
    const value = {
        ...state,
        actions,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use app context
export const useApp = () => {
    const context = useContext(AppContext);

    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }

    return context;
};

// Selectors for specific parts of state
export const useUser = () => {
    const { user, actions } = useApp();
    return {
        ...user,
        setUserWallet: actions.setUserWallet,
        setUserInfo: actions.setUserInfo,
        setUserType: actions.setUserType,
        logout: actions.logout,
        isAdmin: actions.isAdmin(),
        isGuest: actions.isGuest(),
        hasWallet: actions.hasWallet(),
    };
};

export const useAppStatus = () => {
    const { app, actions } = useApp();
    return {
        ...app,
        setLoading: actions.setLoading,
        setError: actions.setError,
        resetError: actions.resetError,
        setNetworkStatus: actions.setNetworkStatus,
    };
};

export const useBlockchain = () => {
    const { blockchain, actions } = useApp();
    return {
        ...blockchain,
        setBlockchainStatus: actions.setBlockchainStatus,
    };
};

export default AppContext;
