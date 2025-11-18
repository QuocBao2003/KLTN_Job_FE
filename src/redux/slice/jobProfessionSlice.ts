import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { callFetchAllJobProfession } from '@/config/api';
import { IJobProfession } from '@/types/backend';

interface IState {
    isFetching: boolean;
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
    result: IJobProfession[];
}

export const fetchJobProfession = createAsyncThunk(
    'jobProfession/fetchJobProfession',
    async ({ query }: { query: string }) => {
        const response = await callFetchAllJobProfession(query);
        return response;
    }
)

const initialState: IState = {
    isFetching: true,
    meta: {
        page: 1,
        pageSize: 10,
        pages: 0,
        total: 0
    },
    result: []
};

export const jobProfessionSlice = createSlice({
    name: 'jobProfession',
    initialState,
    reducers: {
        // Có thể thêm reducers khác nếu cần
    },
    extraReducers: (builder) => {
        builder.addCase(fetchJobProfession.pending, (state, action) => {
            state.isFetching = true;
        })

        builder.addCase(fetchJobProfession.rejected, (state, action) => {
            state.isFetching = false;
        })

        builder.addCase(fetchJobProfession.fulfilled, (state, action) => {
            if (action.payload && action.payload.data) {
                state.isFetching = false;
                state.meta = action.payload.data.meta;
                state.result = action.payload.data.result;
            }
        })
    },
});

export default jobProfessionSlice.reducer;