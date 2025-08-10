// Enhanced navigation utilities and helpers
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { ROUTES, USER_TYPES } from '@/constants/app';
import ErrorHandler from '@/services/errors/ErrorHandler';

class NavigationService {
    constructor() {
        this.navigationHistory = [];
        this.maxHistoryLength = 10;
    }

    // Navigate to a route with error handling
    navigate(route, params = {}) {
        try {
            this.addToHistory(route, params);
            router.push({ pathname: route, params });
        } catch (error) {
            ErrorHandler.logError(error, 'NavigationService.navigate');
            Alert.alert('Navigation Error', 'Failed to navigate to the requested page.');
        }
    }

    // Replace current route
    replace(route, params = {}) {
        try {
            this.addToHistory(route, params);
            router.replace({ pathname: route, params });
        } catch (error) {
            ErrorHandler.logError(error, 'NavigationService.replace');
            Alert.alert('Navigation Error', 'Failed to navigate to the requested page.');
        }
    }

    // Go back with fallback
    goBack(fallbackRoute = ROUTES.HOME) {
        try {
            if (router.canGoBack()) {
                router.back();
            } else {
                this.navigate(fallbackRoute);
            }
        } catch (error) {
            ErrorHandler.logError(error, 'NavigationService.goBack');
            this.navigate(fallbackRoute);
        }
    }

    // Navigate based on user type
    navigateByUserType(userType, defaultRoute = ROUTES.HOME) {
        try {
            let targetRoute;

            switch (userType?.type) {
                case USER_TYPES.ADMIN:
                    targetRoute = ROUTES.ADMIN;
                    break;
                case USER_TYPES.DEFAULT:
                    targetRoute = ROUTES.PROFILE;
                    break;
                case USER_TYPES.GUEST:
                    targetRoute = ROUTES.VALIDATION;
                    break;
                default:
                    targetRoute = defaultRoute;
            }

            this.replace(targetRoute);
        } catch (error) {
            ErrorHandler.logError(error, 'NavigationService.navigateByUserType');
            this.navigate(defaultRoute);
        }
    }

    // Navigate to certificate emission with validation
    navigateToCertificateEmission(userType) {
        if (userType?.type !== USER_TYPES.ADMIN) {
            Alert.alert('Access Denied', 'Only administrators can emit certificates.', [{ text: 'OK' }]);
            return;
        }

        this.navigate(ROUTES.EMISSION);
    }

    // Navigate to profile with authentication check
    navigateToProfile(isAuthenticated) {
        if (!isAuthenticated) {
            Alert.alert('Authentication Required', 'Please connect your wallet to access your profile.', [
                { text: 'Cancel' },
                { text: 'Connect', onPress: () => this.navigate('/') },
            ]);
            return;
        }

        this.navigate(ROUTES.PROFILE);
    }

    // Add route to navigation history
    addToHistory(route, params) {
        const historyItem = {
            route,
            params,
            timestamp: Date.now(),
        };

        this.navigationHistory.unshift(historyItem);

        // Keep history within limit
        if (this.navigationHistory.length > this.maxHistoryLength) {
            this.navigationHistory = this.navigationHistory.slice(0, this.maxHistoryLength);
        }
    }

    // Get navigation history
    getHistory() {
        return [...this.navigationHistory];
    }

    // Clear history
    clearHistory() {
        this.navigationHistory = [];
    }

    // Get previous route
    getPreviousRoute() {
        return this.navigationHistory[1]; // Index 0 is current, 1 is previous
    }

    // Check if user can navigate to route
    canNavigateToRoute(route, userType) {
        const restrictedRoutes = {
            [ROUTES.ADMIN]: [USER_TYPES.ADMIN],
            [ROUTES.EMISSION]: [USER_TYPES.ADMIN],
        };

        const allowedUserTypes = restrictedRoutes[route];
        if (!allowedUserTypes) return true; // No restrictions

        return allowedUserTypes.includes(userType?.type);
    }

    // Navigate with access control
    navigateWithAccessControl(route, userType, params = {}) {
        if (!this.canNavigateToRoute(route, userType)) {
            Alert.alert('Access Denied', 'You do not have permission to access this page.', [{ text: 'OK' }]);
            return false;
        }

        this.navigate(route, params);
        return true;
    }
}

// Create singleton instance
const navigationService = new NavigationService();

// Export navigation helpers
export const navigate = (route, params) => navigationService.navigate(route, params);
export const replace = (route, params) => navigationService.replace(route, params);
export const goBack = fallback => navigationService.goBack(fallback);
export const navigateByUserType = (userType, defaultRoute) =>
    navigationService.navigateByUserType(userType, defaultRoute);
export const navigateToCertificateEmission = userType => navigationService.navigateToCertificateEmission(userType);
export const navigateToProfile = isAuthenticated => navigationService.navigateToProfile(isAuthenticated);
export const navigateWithAccessControl = (route, userType, params) =>
    navigationService.navigateWithAccessControl(route, userType, params);

// Export service instance for advanced usage
export default navigationService;

// Hook for using navigation in components
import { useUser } from '@/contexts/AppContext';

export const useNavigation = () => {
    const { userType, isAuthenticated } = useUser();

    return {
        navigate: (route, params) => navigate(route, params),
        replace: (route, params) => replace(route, params),
        goBack: fallback => goBack(fallback),
        navigateByUserType: defaultRoute => navigateByUserType(userType, defaultRoute),
        navigateToCertificateEmission: () => navigateToCertificateEmission(userType),
        navigateToProfile: () => navigateToProfile(isAuthenticated),
        navigateWithAccessControl: (route, params) => navigateWithAccessControl(route, userType, params),
        canNavigateToRoute: route => navigationService.canNavigateToRoute(route, userType),
        getHistory: () => navigationService.getHistory(),
        userType,
        isAuthenticated,
    };
};
