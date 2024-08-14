import React from "react";
import { Row, Col, Spin } from "antd";

const LoadingScreen = () => {
    return (
        <Row align="middle" justify="center" className="loading-container">
            <Col>
                <Spin size="large" />
            </Col>
            <Col className="ml-7">
                <h2 className="text-white font-mono">Loading...</h2>
            </Col>
        </Row>
    );
};
export default LoadingScreen;
