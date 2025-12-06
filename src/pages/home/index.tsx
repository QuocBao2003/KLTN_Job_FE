import { Divider } from 'antd';
import styles from 'styles/client.module.scss';
import SearchClient from '@/components/client/search.client';
import JobCard from '@/components/client/card/job.card';
import CompanyCard from '@/components/client/card/company.card';
import AIchatButton from '@/components/client/ai-chat-button';
const HomePage = () => {
    return (
        <div className={`${styles["container"]} ${styles["home-section"]}`}>
            <div className="search-content" style={{ marginTop: 0 }}>
                <SearchClient />
            </div>
            <div style={{ margin: 30 }}></div>
            <JobCard />
            
            <div style={{ margin: 30 }}></div>
            <CompanyCard />
          
            <AIchatButton/>
        </div>
    )
}

export default HomePage;