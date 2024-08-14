import React, { createContext, useReducer, useContext } from "react";

// Define the types of actions
const START_LOADING = "START_LOADING";
const STOP_LOADING = "STOP_LOADING";
const SET_ERROR = "SET_ERROR";

// Define the initial state
const initialState = {
    loading: true,
    error: null,
};

// Create a reducer to handle actions
const loadingReducer = (state, action) => {
    switch (action.type) {
        case START_LOADING:
            return { ...state, loading: true };
        case STOP_LOADING:
            return { ...state, loading: false };
        case SET_ERROR:
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

// Create a context
const LoadingContext = createContext();

// Create a provider component
const LoadingProvider = ({ children }) => {
    const [state, dispatch] = useReducer(loadingReducer, initialState);

    return (
        <LoadingContext.Provider value={{ state, dispatch }}>
            {children}
        </LoadingContext.Provider>
    );
};

// Custom hook to use the loading context
const useLoading = () => {
    return useContext(LoadingContext);
};

export { LoadingProvider, useLoading, START_LOADING, STOP_LOADING, SET_ERROR };
