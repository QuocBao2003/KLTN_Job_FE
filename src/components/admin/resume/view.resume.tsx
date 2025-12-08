import { callUpdateResumeStatus } from "@/config/api";
import { IResume } from "@/types/backend";
import { Button, Descriptions, Modal, message, notification } from "antd";
import dayjs from 'dayjs';
import { useState } from 'react';

interface IProps {
    onClose: (v: boolean) => void;
    open: boolean;
    dataInit: IResume | null | any;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}
const ViewDetailResume = (props: IProps) => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const { onClose, open, dataInit, setDataInit, reloadTable } = props;

    const handleUpdateStatus = async (status: "PENDING" | "REVIEWING" | "APPROVED" | "REJECTED") => {
        if (!dataInit?.id) return;
        setIsSubmitting(true);
        const res = await callUpdateResumeStatus(dataInit.id, status);
        if (res.data) {
            message.success("Cập nhật trạng thái thành công!");
            setDataInit((prev: IResume | null) => (prev ? { ...prev, status } as IResume : prev));
            reloadTable();
            handleClose();
        } else {
            notification.error({
                message: "Có lỗi xảy ra",
                description: res.message,
            });
        }
        setIsSubmitting(false);
    };

    const handleClose = () => {
        setDataInit(null);
        onClose(false);
    };

    return (
        <Modal
            title="Thông tin ứng viên"
            open={open}
            onCancel={handleClose}
            footer={null}
            centered
            width="80vw"
            maskClosable={false}
            destroyOnClose
        >
            <div
                style={{
                    display: "flex",
                    gap: 24,
                    minHeight: 420,
                }}
            >
                {/* Thông tin ứng viên */}
                <div style={{ flex: 1 }}>
                    <Descriptions
                        bordered
                        column={1}
                        layout="vertical"
                        size="middle"
                        labelStyle={{ fontWeight: 600 }}
                    >
                        <Descriptions.Item label="Email"  labelStyle={{ color: "#3bb16e" }}>
                            {dataInit?.email}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tên Ứng Viên"  labelStyle={{ color: "#3bb16e" }}>
                            {dataInit?.user?.name}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái"  labelStyle={{ color: "#3bb16e" }}>
                            {dataInit?.status && (
                                <span
                                    style={{
                                        display: "inline-block",
                                        padding: "4px 12px",
                                        borderRadius: 999,
                                        fontWeight: 600,
                                        backgroundColor:
                                            dataInit.status === "APPROVED"
                                                ? "#52c41a"
                                                : dataInit.status === "REJECTED"
                                                    ? "#ff4d4f"
                                                    : "#faad14",
                                        color: "#fff",
                                        minWidth: 100,
                                        textAlign: "center",
                                    }}
                                >
                                    {dataInit.status}
                                </span>
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tên Công Việc"  labelStyle={{ color: "#3bb16e" }}>
                            {dataInit?.job?.name || "Công việc chưa xác định"}
                        </Descriptions.Item>
                        
                        <Descriptions.Item label="Thời gian apply"  labelStyle={{ color: "#3bb16e" }}>
                            {dataInit?.createdAt
                                ? dayjs(dataInit.createdAt).format("DD-MM-YYYY HH:mm:ss")
                                : ""}
                        </Descriptions.Item>
                    </Descriptions>
                </div>

                {/* CV đã gửi lên */}
                <div
                    style={{
                        flex: 1,
                        borderRadius: 8,
                        border: "1px solid #f0f0f0",
                        background:
                            "radial-gradient(circle at top left, #f5f7ff 0, #ffffff 40%, #f0f2f5 100%)",
                        padding: 16,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                    }}
                >
                    <div>
                        <h3 style={{ margin: 0, marginBottom: 8 }}>CV đã gửi lên</h3>
                        <p style={{ margin: 0, marginBottom: 16, color: "#666" }}>
                            Bấm vào nút bên dưới để mở CV trong tab mới.
                        </p>

                        {dataInit?.url ? (
                            <div
                                style={{
                                    borderRadius: 8,
                                    border: "1px dashed #d9d9d9",
                                    padding: 16,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    backgroundColor: "#fff",
                                }}
                            >
                                <div
                                    style={{
                                        width: 40,
                                        height: 50,
                                        borderRadius: 4,
                                        background:
                                            "linear-gradient(135deg, #ff7875 0%, #ff4d4f 100%)",
                                        color: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 700,
                                        fontSize: 16,
                                    }}
                                >
                                    PDF
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            fontWeight: 600,
                                            marginBottom: 4,
                                            wordBreak: "break-all",
                                        }}
                                    >
                                        CV ứng viên
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: "#888",
                                            wordBreak: "break-all",
                                        }}
                                    >
                                        {dataInit.url}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    borderRadius: 8,
                                    border: "1px dashed #d9d9d9",
                                    padding: 16,
                                    textAlign: "center",
                                    backgroundColor: "#fff",
                                    color: "#999",
                                }}
                            >
                                Không có CV đính kèm
                            </div>
                        )}
                    </div>

                    {dataInit?.url && (
                        <div style={{ marginTop: 16, textAlign: "right" }}>
                            <Button
                                type="primary"
                                onClick={() => window.open(dataInit.url, "_blank")}
                            >
                                Xem CV
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div
                style={{
                    marginTop: 24,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 12,
                }}
            >
               
                <Button
                    disabled={isSubmitting}
                    style={{ backgroundColor: "#faad14", color: "#fff" }}
                    onClick={() => handleUpdateStatus("REVIEWING")}
                >
                    Đã xem
                </Button>
                <Button
                    style={{backgroundColor: "#ff4d4f", color: "#fff"}}
                    disabled={isSubmitting}
                    onClick={() => handleUpdateStatus("REJECTED")}
                >
                    Không chấp nhận
                </Button>
                <Button
                    type="primary"
                    loading={isSubmitting}
                    onClick={() => handleUpdateStatus("APPROVED")}
                >
                    Chấp nhận
                </Button>
            </div>
        </Modal>
    )
}

export default ViewDetailResume;