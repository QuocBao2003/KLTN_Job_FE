import { 
    callGetAllServicePackages, 
    callDeleteServicePackage, 
    callToggleServicePackageStatus 
} from '@/config/api';
import { IServicePackage } from '@/types/backend';
import { 
    Table, 
    Button, 
    Space, 
    Tag, 
    Popconfirm, 
    message, 
    Switch,
    Card
} from 'antd';
import { useState, useEffect } from 'react';
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined 
} from '@ant-design/icons';
import ServicePackageModal from './ServicePackageModal';

const AdminServicePackages = () => {
    const [packages, setPackages] = useState<IServicePackage[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingPackage, setEditingPackage] = useState<IServicePackage | null>(null);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const res = await callGetAllServicePackages();
            if (res?.data) {
                setPackages(res.data);
            }
        } catch (error) {
            message.error('Không thể tải danh sách gói dịch vụ!');
        }
        setLoading(false);
    };

    const handleCreate = () => {
        setEditingPackage(null);
        setModalVisible(true);
    };

    const handleEdit = (record: IServicePackage) => {
        setEditingPackage(record);
        setModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await callDeleteServicePackage(id);
            message.success('Xóa gói dịch vụ thành công!');
            fetchPackages();
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không thể xóa gói dịch vụ!');
        }
    };

    const handleToggleStatus = async (id: number) => {
        try {
            await callToggleServicePackageStatus(id);
            message.success('Cập nhật trạng thái thành công!');
            fetchPackages();
        } catch (error) {
            message.error('Không thể cập nhật trạng thái!');
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const getPackageTypeTag = (type: string) => {
        const config: any = {
            'PRIORITY_DISPLAY': { color: 'green', text: 'Ưu tiên hiển thị' },
            'PRIORITY_BOLD_TITLE': { color: 'orange', text: 'Tiêu đề nổi bật' },
            'FEATURED_JOB': { color: 'red', text: 'Công việc hấp dẫn' }
        };
        const item = config[type] || { color: 'default', text: type };
        return <Tag color={item.color}>{item.text}</Tag>;
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 60,
        },
        {
            title: 'Tên gói',
            dataIndex: 'name',
            key: 'name',
            width: 250,
        },
        {
            title: 'Loại gói',
            dataIndex: 'packageType',
            key: 'packageType',
            render: (type: string) => getPackageTypeTag(type),
            width: 180,
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            render: (price: number) => formatPrice(price),
            width: 150,
        },
        {
            title: 'Số tin',
            dataIndex: 'jobLimit',
            key: 'jobLimit',
            align: 'center' as const,
            width: 80,
        },
        {
            title: 'Thời hạn',
            dataIndex: 'durationDays',
            key: 'durationDays',
            render: (days: number) => `${days} ngày`,
            align: 'center' as const,
            width: 100,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'active',
            key: 'active',
            render: (active: boolean, record: IServicePackage) => (
                <Switch
                    checked={active}
                    checkedChildren={<CheckCircleOutlined />}
                    unCheckedChildren={<CloseCircleOutlined />}
                    onChange={() => handleToggleStatus(record.id)}
                />
            ),
            align: 'center' as const,
            width: 100,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: IServicePackage) => (
                <Space size="small">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEdit(record)}
                    >
                        Sửa
                    </Button>
                    <Popconfirm
                        title="Xóa gói dịch vụ"
                        description="Bạn có chắc chắn muốn xóa gói dịch vụ này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                        >
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
            width: 150,
            fixed: 'right' as const,
        },
    ];

    return (
        <Card
            title="Quản lý gói dịch vụ"
            extra={
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreate}
                >
                    Thêm gói dịch vụ
                </Button>
            }
        >
            <Table
                columns={columns}
                dataSource={packages}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} gói dịch vụ`,
                }}
                scroll={{ x: 1200 }}
            />

            <ServicePackageModal
                visible={modalVisible}
                editingPackage={editingPackage}
                onClose={() => {
                    setModalVisible(false);
                    setEditingPackage(null);
                }}
                onSuccess={() => {
                    fetchPackages();
                    setModalVisible(false);
                    setEditingPackage(null);
                }}
            />
        </Card>
    );
};

export default AdminServicePackages;