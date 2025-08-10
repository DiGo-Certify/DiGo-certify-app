// Async operations utility with proper error handling and loading states
import { useState, useCallback } from 'react';
import ErrorHandler from '@/services/errors/ErrorHandler';

/**
 * Custom hook for managing async operations with loading and error states
 * @param {Function} asyncFunction - The async function to execute
 * @param {Object} options - Configuration options
 * @returns {Object} - State and handlers for the async operation
 */
export const useAsync = (asyncFunction, options = {}) => {
    const { immediate = false, onSuccess = null, onError = null, context = '' } = options;

    const [state, setState] = useState({
        data: null,
        loading: false,
        error: null,
        hasRun: false,
    });

    const execute = useCallback(
        async (...args) => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));

                const result = await asyncFunction(...args);

                setState({
                    data: result,
                    loading: false,
                    error: null,
                    hasRun: true,
                });

                if (onSuccess) {
                    onSuccess(result);
                }

                return result;
            } catch (error) {
                const processedError = ErrorHandler.processError(error, context);

                setState({
                    data: null,
                    loading: false,
                    error: processedError,
                    hasRun: true,
                });

                if (onError) {
                    onError(processedError);
                }

                throw processedError;
            }
        },
        [asyncFunction, onSuccess, onError, context]
    );

    const reset = useCallback(() => {
        setState({
            data: null,
            loading: false,
            error: null,
            hasRun: false,
        });
    }, []);

    // Execute immediately if requested
    if (immediate && !state.hasRun) {
        execute();
    }

    return {
        ...state,
        execute,
        reset,
    };
};

/**
 * Utility for debouncing function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export const useDebounce = (func, delay) => {
    const [timeoutId, setTimeoutId] = useState(null);

    return useCallback(
        (...args) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            const newTimeoutId = setTimeout(() => {
                func(...args);
            }, delay);

            setTimeoutId(newTimeoutId);
        },
        [func, delay, timeoutId]
    );
};

/**
 * Utility for managing loading states across multiple operations
 */
export const useLoadingManager = () => {
    const [loadingStates, setLoadingStates] = useState({});

    const setLoading = useCallback((key, isLoading) => {
        setLoadingStates(prev => ({
            ...prev,
            [key]: isLoading,
        }));
    }, []);

    const isLoading = useCallback(
        key => {
            return !!loadingStates[key];
        },
        [loadingStates]
    );

    const isAnyLoading = useCallback(() => {
        return Object.values(loadingStates).some(loading => loading);
    }, [loadingStates]);

    const getLoadingKeys = useCallback(() => {
        return Object.keys(loadingStates).filter(key => loadingStates[key]);
    }, [loadingStates]);

    return {
        setLoading,
        isLoading,
        isAnyLoading,
        getLoadingKeys,
        loadingStates,
    };
};

/**
 * Utility for handling form state with validation
 */
export const useFormState = (initialState, validationFunction) => {
    const [form, setForm] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const setField = useCallback(
        (field, value) => {
            setForm(prev => ({ ...prev, [field]: value }));

            // Clear error when user starts typing
            if (errors[field]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[field];
                    return newErrors;
                });
            }
        },
        [errors]
    );

    const setFieldTouched = useCallback(field => {
        setTouched(prev => ({ ...prev, [field]: true }));
    }, []);

    const validateForm = useCallback(() => {
        if (validationFunction) {
            const validation = validationFunction(form);
            setErrors(validation.errors || {});
            return validation.isValid;
        }
        return true;
    }, [form, validationFunction]);

    const validateField = useCallback(
        field => {
            if (validationFunction) {
                const validation = validationFunction(form);
                const fieldError = validation.errors?.[field];

                if (fieldError) {
                    setErrors(prev => ({ ...prev, [field]: fieldError }));
                } else {
                    setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[field];
                        return newErrors;
                    });
                }

                return !fieldError;
            }
            return true;
        },
        [form, validationFunction]
    );

    const reset = useCallback(() => {
        setForm(initialState);
        setErrors({});
        setTouched({});
    }, [initialState]);

    const isValid = Object.keys(errors).length === 0;
    const hasErrors = Object.keys(errors).length > 0;

    return {
        form,
        errors,
        touched,
        isValid,
        hasErrors,
        setField,
        setFieldTouched,
        validateForm,
        validateField,
        reset,
        setForm,
        setErrors,
    };
};

/**
 * Utility for handling pagination
 */
export const usePagination = (data, itemsPerPage = 10) => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = data.slice(startIndex, endIndex);

    const goToPage = useCallback(
        page => {
            if (page >= 1 && page <= totalPages) {
                setCurrentPage(page);
            }
        },
        [totalPages]
    );

    const nextPage = useCallback(() => {
        goToPage(currentPage + 1);
    }, [currentPage, goToPage]);

    const prevPage = useCallback(() => {
        goToPage(currentPage - 1);
    }, [currentPage, goToPage]);

    const canGoNext = currentPage < totalPages;
    const canGoPrev = currentPage > 1;

    return {
        currentPage,
        totalPages,
        currentData,
        canGoNext,
        canGoPrev,
        goToPage,
        nextPage,
        prevPage,
    };
};

/**
 * Utility for handling search and filtering
 */
export const useSearch = (data, searchFields = []) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({});

    const filteredData = data.filter(item => {
        // Search query filter
        if (searchQuery) {
            const searchMatch = searchFields.some(field => {
                const fieldValue = item[field];
                if (typeof fieldValue === 'string') {
                    return fieldValue.toLowerCase().includes(searchQuery.toLowerCase());
                }
                return false;
            });

            if (!searchMatch) return false;
        }

        // Additional filters
        return Object.entries(filters).every(([key, value]) => {
            if (!value) return true;
            return item[key] === value;
        });
    });

    const setFilter = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
        setSearchQuery('');
    }, []);

    return {
        searchQuery,
        setSearchQuery,
        filters,
        setFilter,
        clearFilters,
        filteredData,
    };
};

export default {
    useAsync,
    useDebounce,
    useLoadingManager,
    useFormState,
    usePagination,
    useSearch,
};
