import DataTable from "@/components/client/data-table";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { IResume } from "@/types/backend";
import { ActionType, ProColumns, ProFormSelect } from '@ant-design/pro-components';
import { Button, Popconfirm, Space, message, notification } from "antd";
import { useState, useRef } from 'react';
import dayjs from 'dayjs';
import { callDeleteResume, createRoomMessage } from "@/config/api";
import queryString from 'query-string';
import { fetchResume } from "@/redux/slice/resumeSlide";
import ViewDetailResume from "@/components/admin/resume/view.resume";
import { ALL_PERMISSIONS } from "@/config/permissions";
import Access from "@/components/share/access";
import { sfIn } from "spring-filter-query-builder";
import { DeleteOutlined, DownloadOutlined, EditOutlined, MessageOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';

const ResumePage = () => {
    const tableRef = useRef<ActionType>();

    const isFetching = useAppSelector(state => state.resume.isFetching);
    const meta = useAppSelector(state => state.resume.meta);
    const resumes = useAppSelector(state => state.resume.result);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [dataInit, setDataInit] = useState<IResume | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState<boolean>(false);

    const handleDeleteResume = async (id: string | undefined) => {
        if (id) {
            const res = await callDeleteResume(id);
            if (res && res.data) {
                message.success('Xóa Resume thành công');
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message
                });
            }
        }
    }
    const resolveJobName = (resume: IResume) => {
        if (typeof resume.jobId === 'object' && resume.jobId?.name) {
            return resume.jobId.name;
        }
        if (resume.job && resume.job.name) {
            return resume.job.name;
        }
        if ((resume as any)?.jobName) {
            return (resume as any).jobName;
        }
        return "Công việc chưa xác định";
    };

    const exportExcel = () => {
        if (!resumes || resumes.length === 0) {
            message.warning("Không có dữ liệu để xuất Excel");
            return;
        }
    
        const firstResume = resumes[0];
        const companyName =
            firstResume?.companyName ||
            (typeof firstResume?.companyId === 'object'
                ? (firstResume?.companyId as any)?.name
                : firstResume?.companyId) ||
            "Công ty chưa xác định";
    
        const now = dayjs().format("DD-MM-YYYY HH:mm:ss");
    
        const dataForExcel = resumes.map((r, index) => ({
            "STT": index + 1,
            "Email ứng viên": r.email,
            "Trạng thái": r.status,
            "Tên công việc": resolveJobName(r),
            "Ngày apply": r.createdAt ? dayjs(r.createdAt).format("DD-MM-YYYY HH:mm:ss") : ""
        }));
    
        const headerRows = [
            [`Tên công ty: ${companyName}`],
            [`Ngày tháng: ${now}`],
            ["Danh sách ứng viên đã apply"],
            [""]
        ];
    
        // Tạo worksheet từ headerRows
        const worksheet = XLSX.utils.aoa_to_sheet(headerRows);
    
        // Thêm dữ liệu bảng ứng viên vào worksheet
        XLSX.utils.sheet_add_json(worksheet, dataForExcel, {
            origin: headerRows.length,
            skipHeader: false
        });
    
        
        const headerRowCount = headerRows.length; 
        const dataRowCount = dataForExcel.length;
        const totalRows = headerRowCount + 1 + dataRowCount; 
    
        // Số cột: lấy max giữa headerRows từng dòng và data keys
        const maxColsFromHeader = headerRows.reduce((max, row) => Math.max(max, row.length), 0);
        const dataCols = dataForExcel.length > 0 ? Object.keys(dataForExcel[0]).length : 0;
        const totalCols = Math.max(maxColsFromHeader, dataCols);
    
        // Build range object
        const safeRange = {
            s: { r: 0, c: 0 },
            e: { r: Math.max(totalRows - 1, 0), c: Math.max(totalCols - 1, 0) }
        };
    
        // Nếu sheet chưa có !ref thì set bằng safeRange, ngược lại decode_range từ nó
        let range;
        if (!worksheet["!ref"]) {
            worksheet["!ref"] = XLSX.utils.encode_range(safeRange);
            range = safeRange;
        } else {
            try {
                range = XLSX.utils.decode_range(worksheet["!ref"]);
            } catch (err) {
                // fallback nếu decode bị lỗi
                worksheet["!ref"] = XLSX.utils.encode_range(safeRange);
                range = safeRange;
            }
        }
    
        // ----- Merge các dòng header để căn giữa toàn bộ tiêu đề -----
        if (!worksheet["!merges"]) worksheet["!merges"] = [];
        const headerRowsToMerge = [0, 1, 2];
        headerRowsToMerge.forEach((rowIndex) => {
            worksheet["!merges"]!.push({
                s: { r: rowIndex, c: 0 },
                e: { r: rowIndex, c: Math.max(totalCols - 1, 0) }
            });
        });
    
        // ----- AUTO-FIT COLUMNS (approx by text length) -----
        worksheet["!cols"] = [];
        for (let C = 0; C < totalCols; C++) {
            let maxWidth = 10; // minimum
            for (let R = 0; R <= range.e.r; R++) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = worksheet[cellAddress];
                if (!cell) continue;
                const text = cell.v ? String(cell.v) : "";
                // đo độ dài chuỗi (có thể điều chỉnh hệ số)
                const len = text.replace(/\t/g, '    ').length;
                if (len > maxWidth) maxWidth = len;
            }
            // width theo số ký tự (wch). + thêm 4 chars để không bị cắt
            worksheet["!cols"][C] = { wch: Math.min(Math.max(maxWidth + 4, 10), 80) };
        }
    
        // ----- (TÙY CHỌN) áp style cho header — LƯU Ý: style này có thể không được ghi bởi SheetJS community -----
        const headerRowIndex = headerRowCount; // dòng header cột thực tế (0-based)
        const headerStyle = {
            font: { bold: true },
            alignment: { horizontal: "center", vertical: "center", wrapText: true }
        };
        const topHeaderStyle = {
            font: { bold: true }
        };
    
        for (let R = 0; R <= range.e.r; R++) {
            for (let C = 0; C <= range.e.c; C++) {
                const addr = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = worksheet[addr];
                if (!cell) continue;
                // căn giữa mặc định
                cell.s = cell.s || {};
                cell.s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
    
                if (R < headerRowIndex - 1) {
                    // áp style cho top header (Tên công ty, Ngày tháng)
                    cell.s = { ...cell.s, ...topHeaderStyle };
                } else if (R === headerRowIndex) {
                    // áp style cho header cột (STT, Email...)
                    cell.s = { ...cell.s, ...headerStyle };
                }
            }
        }
    
        // ----- Append sheet vào workbook và xuất file -----
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách ứng viên");
    
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        saveAs(blob, `Danh_sach_ung_vien_${dayjs().format('DDMMYYYY_HHmmss')}.xlsx`);
    };
    const reloadTable = () => {
        tableRef?.current?.reload();
    }
    const handleMessage = async (resume: IResume) => {
        try {
            // Lấy jobId từ resume
            const job = typeof resume.jobId === 'object' ? resume.jobId : null;
            const jobFull = (resume as any)?.job || null;
            const jobId = job?.id || jobFull?.id || null;

            // Lấy candidateId (userId)
            const userId = typeof resume.userId === 'object' 
                ? (resume.userId as any)?.id 
                : resume.userId;

            if (!jobId) {
                message.warning('Không tìm thấy thông tin công việc');
                return;
            }

            if (!userId) {
                message.warning('Không tìm thấy thông tin ứng viên');
                return;
            }

            // Tạo hoặc lấy phòng chat (HR phải truyền cả jobId và otherUserId)
            const res = await createRoomMessage(String(jobId), String(userId));
            
            if (res && res.data) {
                const room = res.data;
                // Navigate đến trang messages với roomId
                navigate(`/admin/messages?roomId=${room.id}`);
            }
        } catch (error: any) {
            console.error('Error creating message room:', error);
            notification.error({
                message: 'Có lỗi xảy ra',
                description: error?.response?.data?.message || 'Không thể tạo phòng chat'
            });
        }
    };

    const columns: ProColumns<IResume>[] = [
        {
            title: 'STT',
            key: 'index',
            width: 50,
            align: "center",
            render: (text, record, index) => {
                return (
                    <>
                        {(index + 1) + (meta.page - 1) * (meta.pageSize)}
                    </>)
            },
            hideInSearch: true,
        },
        
        {
            title: 'Trạng Thái',
            dataIndex: 'status',
            sorter: true,
            renderFormItem: (item, props, form) => (
                <ProFormSelect
                    showSearch
                    mode="multiple"
                    allowClear
                    valueEnum={{
                        PENDING: 'PENDING',
                        REVIEWING: 'REVIEWING',
                        APPROVED: 'APPROVED',
                        REJECTED: 'REJECTED',
                    }}
                    placeholder="Chọn level"
                />
            ),
        },

        {
            title: 'Tên Công việc',
            dataIndex: ["job", "name"],
            hideInSearch: true,
        },
        {
            title: 'Tên Công ty',
            dataIndex: "companyName",
            hideInSearch: true,
        },

        {
            title: 'Thời gian ứng tuyển',
            dataIndex: 'createdAt',
            width: 200,
            sorter: true,
            render: (text, record, index, action) => {
                return (
                    <>{record.createdAt ? dayjs(record.createdAt).format('DD-MM-YYYY HH:mm:ss') : ""}</>
                )
            },
            hideInSearch: true,
        },
        {
            title: 'Thời gian duyệt',
            dataIndex: 'updatedAt',
            width: 200,
            sorter: true,
            render: (text, record, index, action) => {
                return (
                    <>{record.updatedAt ? dayjs(record.updatedAt).format('DD-MM-YYYY HH:mm:ss') : ""}</>
                )
            },
            hideInSearch: true,
        },
        {

            title: 'Actions',
            hideInSearch: true,
            width: 100,
            render: (_value, entity, _index, _action) => (
                <Space>
                    <MessageOutlined
                        style={{
                            fontSize: 20,
                            color: '#1890ff',
                            cursor: 'pointer'
                        }}
                        onClick={() => handleMessage(entity)}
                        title="Nhắn tin với ứng viên"
                    />
                    <EditOutlined
                        style={{
                            fontSize: 20,
                            color: '#ffa500',
                        }}
                        type=""
                        onClick={() => {
                            setOpenViewDetail(true);
                            setDataInit(entity);
                        }}
                    />

                    <Popconfirm
                        placement="leftTop"
                        title={"Xác nhận xóa resume"}
                        description={"Bạn có chắc chắn muốn xóa resume này ?"}
                        onConfirm={() => handleDeleteResume(entity.id)}
                        okText="Xác nhận"
                        cancelText="Hủy"
                    >
                        <span style={{ cursor: "pointer", margin: "0 10px" }}>
                            <DeleteOutlined
                                style={{
                                    fontSize: 20,
                                    color: '#ff4d4f',
                                }}
                            />
                        </span>
                    </Popconfirm>
                </Space>
            ),

        },
    ];

    const buildQuery = (params: any, sort: any, filter: any) => {
        const clone = { ...params };

        if (clone?.status?.length) {
            clone.filter = sfIn("status", clone.status).toString();
            delete clone.status;
        }

        clone.page = clone.current;
        clone.size = clone.pageSize;

        delete clone.current;
        delete clone.pageSize;

        let temp = queryString.stringify(clone);

        let sortBy = "";
        if (sort && sort.status) {
            sortBy = sort.status === 'ascend' ? "sort=status,asc" : "sort=status,desc";
        }

        if (sort && sort.createdAt) {
            sortBy = sort.createdAt === 'ascend' ? "sort=createdAt,asc" : "sort=createdAt,desc";
        }
        if (sort && sort.updatedAt) {
            sortBy = sort.updatedAt === 'ascend' ? "sort=updatedAt,asc" : "sort=updatedAt,desc";
        }

        //mặc định sort theo updatedAt
        if (Object.keys(sortBy).length === 0) {
            temp = `${temp}&sort=updatedAt,desc`;
        } else {
            temp = `${temp}&${sortBy}`;
        }

        // temp += "&populate=companyId,jobId&fields=companyId.id, companyId.name, companyId.logo, jobId.id, jobId.name";
        return temp;
    }

    return (
        <div>
            <Access
                permission={ALL_PERMISSIONS.RESUMES.GET_PAGINATE}
            >
                <DataTable<IResume>
                    actionRef={tableRef}
                    headerTitle="Danh sách Resumes"
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={resumes}
                    request={async (params, sort, filter): Promise<any> => {
                        const query = buildQuery(params, sort, filter);
                        dispatch(fetchResume({ query }))
                    }}
                    scroll={{ x: true }}
                    pagination={
                        {
                            current: meta.page,
                            pageSize: meta.pageSize,
                            showSizeChanger: true,
                            total: meta.total,
                            showTotal: (total, range) => { return (<div> {range[0]}-{range[1]} trên {total} rows</div>) }
                        }
                    }
                    rowSelection={false}
                    toolBarRender={(_action, _rows): any => [
                        <Button
                            key="export-resume"
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={exportExcel}
                            disabled={!resumes?.length}
                        >
                            Xuất Excel
                        </Button>
                    ]}
                />
            </Access>
            <ViewDetailResume
                open={openViewDetail}
                onClose={setOpenViewDetail}
                dataInit={dataInit}
                setDataInit={setDataInit}
                reloadTable={reloadTable}
            />
        </div >
    )
}

export default ResumePage;