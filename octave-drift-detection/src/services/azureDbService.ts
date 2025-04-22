const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function getDashboardData(mode: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/metrics/${mode}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching metrics data:", error);
    return {};
  }
}

export async function getKPIs(mode: string) {
  return getDashboardData(mode);
}

export async function getErrorData() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/errors`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching error data:", error);
    return [];
  }
}

export async function getBusinessUnits() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/business-units`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching business units:", error);
    return [];
  }
}

export async function getUseCases() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/use-cases`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching use cases:", error);
    return [];
  }
}
