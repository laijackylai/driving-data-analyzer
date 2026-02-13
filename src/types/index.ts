// Driving data types

export interface DrivingDataPoint {
  timestamp: string;
  speed: number; // km/h
  latitude?: number;
  longitude?: number;
  acceleration?: number; // m/s²
  braking?: number; // brake force
  steering?: number; // steering angle
}

export interface DrivingSession {
  id: string;
  startTime: string;
  endTime: string;
  distance: number; // km
  duration: number; // seconds
  dataPoints: DrivingDataPoint[];
}

export interface AnalysisResult {
  sessionId: string;
  metrics: {
    averageSpeed: number;
    maxSpeed: number;
    harshBrakingEvents: number;
    rapidAccelerationEvents: number;
    distanceTraveled: number;
    durationMinutes: number;
  };
  safetyScore?: number;
  timestamp: string;
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content: string | ArrayBuffer;
}
