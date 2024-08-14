import { Row, Col, Flex } from "antd";
import { useState, useEffect } from "react";
import {
    LoadingProvider,
    useLoading,
    START_LOADING,
    STOP_LOADING,
    SET_ERROR,
} from "./components/LoadingContext";
import logo from "./assets/images/logo.svg";
import "./assets/css/layout.css";

import LoadingScreen from "./components/LoadingScreen";
import CardWrapper from "./components/CardWrapper";
import DataBarChart from "./components/DataBarChart";
import HorizontalBarChart from "./components/HorizontalBarChart";
import PieChart from "./components/PieChart";
import useFetchData from "./components/useFetchData";

const MainApp = () => {
    const { data, loading, error } = useFetchData(
        "http://localhost:7000/combined_json_data"
    );

    if (loading) {
        return (
            <div className="loading-screen">
                <LoadingScreen />
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-screen">
                <div>{error}</div>
            </div>
        );
    }

    return (
        <Col className="bg-black p-4 min-h-screen">
            <Row>
                <Col align="center" xs={24} sm={24} md={24} lg={8}>
                    <Flex align="start" vertical className="p-2">
                        <img
                            src={logo}
                            alt="company logo"
                            className="w-auto h-8 mr-4"
                        />
                    </Flex>
                </Col>
                <Col align="center" xs={24} sm={24} md={24} lg={8}>
                    <Flex
                        justify="center"
                        align="center"
                        vertical
                        className="p-2"
                    >
                        <div className="p-2">
                            <h1 className="lg:text-2xl md:text-2xl sm:text-sm text-stone-300 font-mono flex justify-center">
                                Technician Overview
                            </h1>
                            <h2 className="text-1xl text-stone-300 font-mono flex justify-center mb-2">
                                Track Activity
                            </h2>
                        </div>
                    </Flex>
                </Col>
                <Col xs={24} sm={24} md={12} lg={8}>
                    <Flex justify="center" align="center" vertical>
                        <h2 className="text-1xl text-stone-300 font-mono">
                            Last updated on:
                        </h2>
                    </Flex>
                </Col>
            </Row>
            <Row
                type="flex"
                direction="vertical"
                gutter={[16, 24]}
                className="mt-8"
            >
                <CardWrapper data={data} />
            </Row>
            <Row gutter={[8, 16]} className="p-2 mt-10">
                <Col xs={24} sm={24} md={12} lg={8}>
                    <DataBarChart data={data} />
                </Col>
                <Col xs={24} sm={24} md={12} lg={8}>
                    <HorizontalBarChart data={data} />
                </Col>
                <Col xs={24} sm={24} md={12} lg={8}>
                    <PieChart data={data} />
                </Col>
            </Row>
        </Col>
    );
};

const App = () => {
    return (
        <LoadingProvider>
            <MainApp />
        </LoadingProvider>
    );
};

export default App;
