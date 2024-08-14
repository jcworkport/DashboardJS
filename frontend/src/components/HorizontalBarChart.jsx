import React, { useEffect, useState } from "react";
import {
    useLoading,
    START_LOADING,
    STOP_LOADING,
    SET_ERROR,
} from "./LoadingContext";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const HorizontalBarChart = ({ data }) => {
    const horizontalChartData = data.tech_table;
    const uniqueTechnician = Array.from(
        new Set(horizontalChartData.map((item) => item.Technician))
    );

    const techOrders = horizontalChartData.map((item) => item.Orders);
    const techFeedback = horizontalChartData.map((item) => item.Feedback);
    const techDiscrepancies = horizontalChartData.map(
        (item) => item.Discrepancies
    );

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        elements: {
            bar: {
                borderWidth: 2,
            },
        },
        plugins: {
            legend: {
                display: true,
                position: "top",
                labels: {
                    font: {
                        size: 10,
                        weight: "bold", // Adjust this value to make the font size smaller or larger
                    },
                    boxWidth: 7, // Adjust this value to change the size of the colored boxes
                    padding: 7, // Adjust the spacing between legend items
                },
                title: {
                    display: true,
                    text: "Technicians",
                    font: {
                        size: 14,
                        weight: "bold",
                    },
                },
            },
            datalabels: false,
        },
        scales: {
            x: {
                stacked: true,
            },
            y: {
                stacked: true,
            },
        },
    };

    const hBardata = {
        labels: uniqueTechnician,
        datasets: [
            {
                label: "Orders",
                data: techOrders,
                borderColor: "#3a86ff",
                backgroundColor: "#3a86ff",
                stack: "Stack 0",
            },
            {
                label: "Discrepancies",
                data: techDiscrepancies,
                borderColor: "#ff006e",
                backgroundColor: "#ff006e",
                stack: "Stack 0",
            },
            {
                label: "Feedback",
                data: techFeedback,
                borderColor: "#06d6a0",
                backgroundColor: "#06d6a0",
                stack: "Stack 1",
            },
        ],
    };
    return (
        <div className="flex p-4 bg-zinc-950 rounded-md h-full w-full">
            <Bar
                options={options}
                data={hBardata}
                style={{ width: "320px", height: "250px" }}
            />
        </div>
    );
};

export default HorizontalBarChart;
