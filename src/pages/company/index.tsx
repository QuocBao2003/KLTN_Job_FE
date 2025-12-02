import { Col, Row } from 'antd';
import styles from 'styles/client.module.scss';
import CompanyCard from '@/components/client/card/company.card';
// Import component SearchCompany mới thay vì SearchClient cũ
import SearchCompany from '@/components/client/search.company';

const ClientCompanyPage = (props: any) => {
    return (
        <div className={styles["container"]} style={{ marginTop: 20 }}>
            <div className="search-content" style={{ marginTop: 20 }}>
                 {/* Sử dụng SearchCompany ở đây */}
                <SearchCompany />
            </div>
            <Row gutter={[20, 20]}>
                <Col span={24}>
                    <CompanyCard
                        showPagination={true}
                    />
                </Col>
            </Row>
        </div>
    )
}

export default ClientCompanyPage;