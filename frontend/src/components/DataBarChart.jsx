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
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels
);

const DataBarChart = ({ data }) => {
    const barData = data.monthlyJobsDiscrepancies;
    const uniqueMonths = Array.from(new Set(barData.map((item) => item.month)));

    const refCodeCounts = uniqueMonths.map(
        (month) => barData.find((item) => item.month === month)?.refCode || 0
    );

    const discrepanciesCounts = uniqueMonths.map(
        (month) =>
            barData.find((item) => item.month === month)?.Discrepancies || 0
    );

    const monthlyData = {
        labels: uniqueMonths,
        datasets: [
            {
                label: "Orders",
                data: refCodeCounts,
                backgroundColor: "#3a86ff",
                borderColor: "#3a86ff",
                borderWidth: 1,
            },
            {
                label: "Discrepancies",
                data: discrepanciesCounts,
                backgroundColor: "#ff006e",
                borderColor: "#ff006e",
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
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
                    text: "Orders By Month",
                    font: {
                        size: 14,
                        weight: "bold",
                    },
                },
            },

            datalabels: {
                display: function (context) {
                    return context.dataset.data[context.dataIndex] !== 0;
                },
                anchor: "center",
                align: "center",
                font: {
                    size: 12,
                    weight: "bold",
                },
                color: "white", // Change this to the desired label color
            },
        },
    };

    return (
        <div className="flex p-4 bg-zinc-950 rounded-md h-full w-full">
            <Bar data={monthlyData} options={options} />
        </div>
    );
};

export default DataBarChart;
