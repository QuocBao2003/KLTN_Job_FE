import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { callFetchAllJobProfession, callFetchAllJobProfessionAll } from '@/config/api';
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
export const fetchAllJobProfession = createAsyncThunk(
    'jobProfession/fetchAllJobProfession',
    async ({ query }: { query: string }) => {
        const response = await callFetchAllJobProfessionAll(query);
        return response;
    }
);

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
    reducers: {},
    extraReducers: (builder) => {
        // ----- fetchJobProfession -----
        builder.addCase(fetchJobProfession.pending, (state) => {
            state.isFetching = true;
        })
        builder.addCase(fetchJobProfession.rejected, (state) => {
            state.isFetching = false;
        })
        builder.addCase(fetchJobProfession.fulfilled, (state, action) => {
            if (action.payload?.data) {
                state.isFetching = false;
                state.meta = action.payload.data.meta;
                state.result = action.payload.data.result;
            }
        });

        // ----- fetchAllJobProfession -----
        builder.addCase(fetchAllJobProfession.pending, (state) => {
            state.isFetching = true;
        })
        builder.addCase(fetchAllJobProfession.rejected, (state) => {
            state.isFetching = false;
        })
        builder.addCase(fetchAllJobProfession.fulfilled, (state, action) => {
            if (action.payload?.data) {
                state.isFetching = false;
                // Trường hợp fetchAll thì meta có thể không có → tuỳ backend
                state.meta = action.payload.data.meta ?? state.meta;
                state.result = action.payload.data.result;
            }
        });
    },
});

export default jobProfessionSlice.reducer;