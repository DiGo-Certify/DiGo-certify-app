import React from 'react';
import { List } from 'react-native-paper';

const CertificateList = ({ certificates }) => {
    return (
        <List.Section>
            {certificates.map(certificate => (
                <List.Item key={certificate.id} title={certificate.title} />
            ))}
        </List.Section>
    );
};

export default CertificateList;
