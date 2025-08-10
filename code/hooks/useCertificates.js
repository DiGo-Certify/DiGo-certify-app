// Custom hook for managing certificates
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useUser } from '@/contexts/AppContext';
import BlockchainService from '@/services/blockchain/BlockchainService';
import { CLAIM_TOPICS_OBJ } from '@/services/ethereum/scripts/claims/claimTopics';
import ErrorHandler from '@/services/errors/ErrorHandler';
import { ethers } from 'ethers';

export const useCertificates = () => {
    const { wallet } = useUser();
    const [certificates, setCertificates] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Load certificates from blockchain
    const loadCertificates = useCallback(
        async (showLoading = true) => {
            if (!wallet?.address) {
                setCertificates([]);
                return;
            }

            try {
                if (showLoading) setIsLoading(true);
                setError(null);

                const claims = await BlockchainService.getUserClaims(wallet.address);
                const formattedCertificates = formatCertificateData(claims);

                setCertificates(formattedCertificates);
            } catch (error) {
                const processedError = ErrorHandler.processError(error, 'loadCertificates');
                setError(processedError.userMessage);

                if (showLoading) {
                    Alert.alert('Error', processedError.userMessage);
                }
            } finally {
                if (showLoading) setIsLoading(false);
            }
        },
        [wallet?.address]
    );

    // Refresh certificates (for pull-to-refresh)
    const refreshCertificates = useCallback(async () => {
        setRefreshing(true);
        await loadCertificates(false);
        setRefreshing(false);
    }, [loadCertificates]);

    // Format certificate data from blockchain claims
    const formatCertificateData = useCallback(claims => {
        if (!claims?.certificates || claims.certificates.length === 0) {
            return [];
        }

        return claims.certificates.map((certificate, index) => {
            try {
                // Find related institution and student claims
                const institution = claims.institutions?.find(inst => inst.issuer.trim() === certificate.issuer.trim());
                const student = claims.students?.find(std => std.issuer.trim() === certificate.issuer.trim());
                const studentFromDifferentIssuer = claims.students?.find(
                    std => std.issuer.trim() !== certificate.issuer.trim()
                );

                // Parse claim data
                const instData = institution ? JSON.parse(ethers.toUtf8String(institution.data)) : {};
                const certData = JSON.parse(ethers.toUtf8String(certificate.data));
                const studentData = student ? ethers.toUtf8String(student.data) : '';
                const studentFirstClaimData = studentFromDifferentIssuer
                    ? JSON.parse(ethers.toUtf8String(studentFromDifferentIssuer.data))
                    : {};

                return {
                    id: `cert_${index}_${certificate.issuer}`,
                    title: `Certificate ${certData.registrationCode}`,
                    institution: formatInstitutionName(instData.institutionID),
                    institutionId: instData.institutionID,
                    course: instData.courseID || 'Unknown Course',
                    courseId: instData.courseID,
                    grade: studentData || 'Unknown Grade',
                    registrationCode: certData.registrationCode,
                    certificate: certData.certificate,
                    issuer: certificate.issuer,
                    uri: certificate.uri || null,
                    issuedDate: new Date().toISOString(), // You might want to get this from blockchain
                    studentInfo: studentFirstClaimData,

                    // Additional metadata
                    claimId: certificate.claimId,
                    signature: certificate.signature,
                    scheme: certificate.scheme,
                };
            } catch (error) {
                ErrorHandler.logError(error, `formatCertificateData-${index}`);

                // Return a fallback certificate object
                return {
                    id: `cert_error_${index}`,
                    title: `Certificate ${index + 1}`,
                    institution: 'Data parsing error',
                    institutionId: 'unknown',
                    course: 'Unknown',
                    courseId: 'unknown',
                    grade: 'Unknown',
                    registrationCode: 'Unknown',
                    certificate: 'Error parsing data',
                    issuer: certificate.issuer,
                    uri: null,
                    issuedDate: new Date().toISOString(),
                    studentInfo: {},

                    // Mark as error
                    hasError: true,
                    errorMessage: 'Failed to parse certificate data',
                };
            }
        });
    }, []);

    // Format institution name
    const formatInstitutionName = useCallback(institutionId => {
        if (!institutionId) return 'Unknown Institution';

        // You can add a mapping of institution IDs to names here
        const institutionNames = {
            3117: 'Instituto Superior de Engenharia do Porto',
            3311: 'Universidade do Porto',
            // Add more mappings as needed
        };

        return institutionNames[institutionId] || `Institution ${institutionId}`;
    }, []);

    // Search certificates
    const searchCertificates = useCallback((query, certificates) => {
        if (!query.trim()) return certificates;

        const searchTerm = query.toLowerCase();
        return certificates.filter(
            cert =>
                cert.title.toLowerCase().includes(searchTerm) ||
                cert.institution.toLowerCase().includes(searchTerm) ||
                cert.course.toLowerCase().includes(searchTerm) ||
                cert.grade.toLowerCase().includes(searchTerm) ||
                cert.registrationCode.toLowerCase().includes(searchTerm)
        );
    }, []);

    // Filter certificates by criteria
    const filterCertificates = useCallback((filters, certificates) => {
        return certificates.filter(cert => {
            if (filters.institution && cert.institutionId !== filters.institution) {
                return false;
            }
            if (filters.grade && cert.grade !== filters.grade) {
                return false;
            }
            if (filters.hasError !== undefined && cert.hasError !== filters.hasError) {
                return false;
            }
            return true;
        });
    }, []);

    // Get certificate statistics
    const getCertificateStats = useCallback(certificates => {
        const stats = {
            total: certificates.length,
            byInstitution: {},
            byGrade: {},
            withErrors: certificates.filter(cert => cert.hasError).length,
        };

        certificates.forEach(cert => {
            // Count by institution
            const inst = cert.institution;
            stats.byInstitution[inst] = (stats.byInstitution[inst] || 0) + 1;

            // Count by grade
            const grade = cert.grade;
            stats.byGrade[grade] = (stats.byGrade[grade] || 0) + 1;
        });

        return stats;
    }, []);

    // Load certificates on mount and wallet change
    useEffect(() => {
        loadCertificates();
    }, [loadCertificates]);

    // Clear certificates when wallet is disconnected
    useEffect(() => {
        if (!wallet?.address) {
            setCertificates([]);
            setError(null);
        }
    }, [wallet?.address]);

    return {
        // State
        certificates,
        isLoading,
        error,
        refreshing,

        // Actions
        loadCertificates,
        refreshCertificates,
        searchCertificates,
        filterCertificates,

        // Utilities
        getCertificateStats,
        formatInstitutionName,

        // Clear error
        clearError: () => setError(null),
    };
};
