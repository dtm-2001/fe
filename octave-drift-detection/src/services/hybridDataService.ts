import axios from 'axios';
import { BusinessUnit, UseCase, KPI, ErrorData } from '../types/app';

const API_BASE_URL = 'http://localhost:5000/api';

// Fetch business units
export async function getBusinessUnits(): Promise<BusinessUnit[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/business-units`);
    return response.data;
  } catch (error) {
    console.error('Error fetching business units:', error);
    return [];
  }
}

// Fetch use cases for a business unit
export async function getUseCases(businessUnitId: string): Promise<UseCase[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/use-cases/${businessUnitId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching use cases:', error);
    return [];
  }
}

// Fetch metrics for a mode
export async function getMetrics(mode: string): Promise<KPI[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/metrics/${mode}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return [];
  }
}

// Fetch errors
export async function getErrors(): Promise<ErrorData[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/errors`);
    return response.data;
  } catch (error) {
    console.error('Error fetching errors:', error);
    return [];
  }
}