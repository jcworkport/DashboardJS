import { useState, useEffect } from "react";
import {
    useLoading,
    START_LOADING,
    STOP_LOADING,
    SET_ERROR,
} from "./LoadingContext";

const useFetchData = (url) => {
    const [data, setData] = useState([]);
    const { state, dispatch } = useLoading();

    useEffect(() => {
        dispatch({ type: START_LOADING });
        const fetchData = async () => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                const result = await response.json();
                setData(result);
            } catch (error) {
                dispatch({ type: SET_ERROR, payload: error.message });
            } finally {
                dispatch({ type: STOP_LOADING });
            }
        };

        fetchData();
    }, [url, dispatch]);

    return { data, loading: state.loading, error: state.error };
};

export default useFetchData;
