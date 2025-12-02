import { Button, Col, Form, Row } from 'antd';
import { EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import { LOCATION_LIST } from '@/config/utils'; // Giả sử bạn dùng chung list địa điểm
import { ProForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import { useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

const SearchCompany = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [form] = Form.useForm();

    // 1. Fill dữ liệu từ URL vào Form khi reload trang
    useEffect(() => {
        // Chỉ lấy name và location vì Company không có skill/profession
        const queryName = searchParams.get("name");
        // const queryLocation = searchParams.get("location");

        if (queryName) form.setFieldValue("name", queryName);
        // if (queryLocation) form.setFieldValue("location", queryLocation.split(","));
        
    }, [searchParams, form]);

    const onFinish = async (values: any) => {
        const params = new URLSearchParams(searchParams);

        // Xử lý Name
        if (values?.name) {
            params.set('name', values.name);
        } else {
            params.delete('name');
        }

        // Xử lý Location
        // if (values?.location?.length) {
        //     params.set('location', values.location.join(','));
        // } else {
        //     params.delete('location');
        // }

        // Reset về trang 1 khi tìm kiếm mới
        params.set('current', '1');

        // Navigate về chính trang hiện tại kèm params
        navigate(`${location.pathname}?${params.toString()}`);
    }

    return (
        <ProForm
            form={form}
            onFinish={onFinish}
            submitter={{ render: () => <></> }}
            style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        >
            <Row gutter={[16, 16]}>
                <Col span={24}><h2 style={{ color: '#00b14f' }}>Khám phá Công ty</h2></Col>

                {/* 1. Keyword: Tên công ty */}
                <Col span={24} md={12}>
                    <ProFormText
                        name="name"
                        placeholder="Nhập tên công ty..."
                        fieldProps={{
                            prefix: <SearchOutlined style={{ color: '#ccc' }} />,
                            size: 'large'
                        }}
                    />
                </Col>

                {/* 2. Location: Địa điểm */}
                {/* <Col span={24} md={6}>
                    <ProFormSelect
                        name="location"
                        mode="multiple"
                        placeholder="Địa điểm"
                        options={LOCATION_LIST}
                        fieldProps={{
                            suffixIcon: <EnvironmentOutlined />,
                            size: 'large',
                            maxTagCount: 'responsive'
                        }}
                    />
                </Col> */}

                {/* 3. Search Button */}
                <Col span={24} md={6}>
                    <Button
                        type='primary'
                        onClick={() => form.submit()}
                        size='large'
                        style={{ width: '100%', background: '#00b14f', borderColor: '#00b14f', fontWeight: 'bold' }}
                    >
                        TÌM KIẾM
                    </Button>
                </Col>
            </Row>
        </ProForm>
    )
}

export default SearchCompany;