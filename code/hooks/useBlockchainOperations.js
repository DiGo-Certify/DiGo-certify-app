// Hook for managing real-time blockchain operations
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStatus } from '@/contexts/AppContext';
import BlockchainService from '@/services/blockchain/BlockchainService';

export const useBlockchainOperations = () => {
    const { isLoading } = useAppStatus();
    const [operations, setOperations] = useState([]);
    const [networkStatus, setNetworkStatus] = useState('disconnected');
    const [gasPrice, setGasPrice] = useState(null);
    const [blockNumber, setBlockNumber] = useState(null);

    const operationIdRef = useRef(0);
    const operationsRef = useRef(new Map());

    // Generate unique operation ID
    const generateOperationId = useCallback(() => {
        operationIdRef.current += 1;
        return `op_${Date.now()}_${operationIdRef.current}`;
    }, []);

    // Add new operation
    const addOperation = useCallback(
        operationData => {
            const id = generateOperationId();
            const operation = {
                id,
                ...operationData,
                status: 'pending',
                progress: 0,
                startTime: Date.now(),
                error: null,
            };

            operationsRef.current.set(id, operation);
            setOperations(Array.from(operationsRef.current.values()));

            return id;
        },
        [generateOperationId]
    );

    // Update operation status
    const updateOperation = useCallback((id, updates) => {
        const operation = operationsRef.current.get(id);
        if (operation) {
            const updatedOperation = { ...operation, ...updates };
            operationsRef.current.set(id, updatedOperation);
            setOperations(Array.from(operationsRef.current.values()));
        }
    }, []);

    // Complete operation
    const completeOperation = useCallback(
        (id, result = null, error = null) => {
            updateOperation(id, {
                status: error ? 'failed' : 'completed',
                progress: 1,
                endTime: Date.now(),
                result,
                error,
            });

            // Auto-remove completed operations after 5 seconds
            setTimeout(() => {
                operationsRef.current.delete(id);
                setOperations(Array.from(operationsRef.current.values()));
            }, 5000);
        },
        [updateOperation]
    );

    // Remove operation
    const removeOperation = useCallback(id => {
        operationsRef.current.delete(id);
        setOperations(Array.from(operationsRef.current.values()));
    }, []);

    // Clear all operations
    const clearOperations = useCallback(() => {
        operationsRef.current.clear();
        setOperations([]);
    }, []);

    // Wrapped blockchain operations with automatic tracking
    const executeOperation = useCallback(
        async (operationConfig, blockchainFunction) => {
            const operationId = addOperation(operationConfig);

            try {
                updateOperation(operationId, { status: 'processing', progress: 0.2 });

                const result = await blockchainFunction(progress => {
                    updateOperation(operationId, { progress: Math.min(progress, 0.9) });
                });

                updateOperation(operationId, { progress: 0.9 });
                completeOperation(operationId, result);

                return result;
            } catch (error) {
                completeOperation(operationId, null, error);
                throw error;
            }
        },
        [addOperation, updateOperation, completeOperation]
    );

    // Specific blockchain operation wrappers
    const createIdentity = useCallback(
        async userData => {
            return executeOperation(
                {
                    type: 'identity_creation',
                    name: 'Creating Identity',
                    description: `Creating blockchain identity for ${userData.name}`,
                },
                async onProgress => {
                    onProgress(0.3);
                    const result = await BlockchainService.createIdentity(userData);
                    onProgress(0.8);
                    return result;
                }
            );
        },
        [executeOperation]
    );

    const requestCertificate = useCallback(
        async certificateData => {
            return executeOperation(
                {
                    type: 'certificate_request',
                    name: 'Requesting Certificate',
                    description: `Requesting certificate: ${certificateData.courseName}`,
                },
                async onProgress => {
                    onProgress(0.2);
                    const result = await BlockchainService.requestCertificate(certificateData);
                    onProgress(0.7);
                    return result;
                }
            );
        },
        [executeOperation]
    );

    const emitCertificate = useCallback(
        async claimData => {
            return executeOperation(
                {
                    type: 'certificate_emission',
                    name: 'Emitting Certificate',
                    description: `Emitting certificate for ${claimData.studentName}`,
                },
                async onProgress => {
                    onProgress(0.2);
                    const result = await BlockchainService.emitCertificate(claimData);
                    onProgress(0.8);
                    return result;
                }
            );
        },
        [executeOperation]
    );

    const validateCertificate = useCallback(
        async certificateId => {
            return executeOperation(
                {
                    type: 'certificate_validation',
                    name: 'Validating Certificate',
                    description: `Validating certificate ${certificateId}`,
                },
                async onProgress => {
                    onProgress(0.3);
                    const result = await BlockchainService.validateCertificate(certificateId);
                    onProgress(0.8);
                    return result;
                }
            );
        },
        [executeOperation]
    );

    // Monitor network status
    useEffect(() => {
        let statusInterval;

        const checkNetworkStatus = async () => {
            try {
                const isConnected = await BlockchainService.checkConnection();
                setNetworkStatus(isConnected ? 'connected' : 'disconnected');

                if (isConnected) {
                    // Get additional network info
                    try {
                        const [currentGasPrice, currentBlock] = await Promise.all([
                            BlockchainService.getGasPrice?.(),
                            BlockchainService.getBlockNumber?.(),
                        ]);

                        if (currentGasPrice) setGasPrice(currentGasPrice);
                        if (currentBlock) setBlockNumber(currentBlock);
                    } catch (error) {
                        console.warn('Could not fetch network details:', error);
                    }
                }
            } catch (error) {
                setNetworkStatus('error');
            }
        };

        // Initial check
        checkNetworkStatus();

        // Set up periodic monitoring
        statusInterval = setInterval(checkNetworkStatus, 15000); // Every 15 seconds

        return () => {
            if (statusInterval) clearInterval(statusInterval);
        };
    }, []);

    // Get operation statistics
    const getOperationStats = useCallback(() => {
        const ops = Array.from(operationsRef.current.values());
        return {
            total: ops.length,
            pending: ops.filter(op => op.status === 'pending').length,
            processing: ops.filter(op => op.status === 'processing').length,
            completed: ops.filter(op => op.status === 'completed').length,
            failed: ops.filter(op => op.status === 'failed').length,
        };
    }, []);

    // Get operations by type
    const getOperationsByType = useCallback(type => {
        return Array.from(operationsRef.current.values()).filter(op => op.type === type);
    }, []);

    // Get recent operations
    const getRecentOperations = useCallback((limit = 10) => {
        return Array.from(operationsRef.current.values())
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, limit);
    }, []);

    return {
        // State
        operations,
        networkStatus,
        gasPrice,
        blockNumber,
        isConnected: networkStatus === 'connected',

        // Operation management
        addOperation,
        updateOperation,
        completeOperation,
        removeOperation,
        clearOperations,

        // Blockchain operations
        createIdentity,
        requestCertificate,
        emitCertificate,
        validateCertificate,
        executeOperation,

        // Statistics and queries
        getOperationStats,
        getOperationsByType,
        getRecentOperations,

        // Computed properties
        hasActiveOperations: operations.length > 0,
        activeOperationsCount: operations.filter(op => op.status === 'pending' || op.status === 'processing').length,
    };
};

export default useBlockchainOperations;
