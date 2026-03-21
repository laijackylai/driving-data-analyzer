import { ThresholdConfig } from "@/types";

/**
 * 2024 Subaru Impreza RS threshold configuration.
 * Engine: 2.5L FB25 naturally aspirated boxer. Redline 6200 RPM.
 * Transmission: Lineartronic CVT.
 * Drivetrain: Symmetrical AWD.
 */
export const IMPREZA_RS_THRESHOLDS: ThresholdConfig = {
  engineRpm: {
    normal: [0, 5000],
    warning: [5000, 6000],
    danger: [6000, 8000],
  },
  coolantTemp: {
    normal: [80, 100],
    warning: [100, 108],
    danger: [108, 150],
  },
  oilTemp: {
    normal: [80, 110],
    warning: [110, 125],
    danger: [125, 180],
  },
  cvtTemp: {
    normal: [60, 100],
    warning: [100, 120],
    danger: [120, 180],
  },
  batteryVoltage: {
    normal: [13.8, 14.6],
    warning: [[12.5, 13.8], [14.6, 15.0]],
    danger: [[0, 12.5], [15.0, 20.0]],
  },
  calculatedBoost: {
    normal: [-0.8, -0.2],
    warning: [-0.2, 0],
    danger: [0, 2],
  },
  knockCorrection: {
    normal: [-1, 0],
    warning: [-3, -1],
    danger: [-20, -3],
  },
  shortTermFuelTrim: {
    normal: [-5, 5],
    warning: [[-10, -5], [5, 10]],
    danger: [[-50, -10], [10, 50]],
  },
  longTermFuelTrim: {
    normal: [-5, 5],
    warning: [[-8, -5], [5, 8]],
    danger: [[-50, -8], [8, 50]],
  },
  mafAirFlowRate: {
    normal: [2, 40],
    warning: [40, 50],
    danger: [50, 100],
  },
};
