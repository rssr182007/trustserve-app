import { supabase } from './supabaseClient';

export const getActiveCities = async () => {
  const { data, error } = await supabase
    .from('active_cities')
    .select('*')
    .eq('is_active', true)
    .order('district', { ascending: true })
    .order('city_name', { ascending: true });

  if (error) {
    console.error('Error fetching active cities:', error);
    return [];
  }
  return data || [];
};

export const getAllCities = async () => {
  const { data, error } = await supabase
    .from('active_cities')
    .select('*')
    .order('district', { ascending: true })
    .order('city_name', { ascending: true });

  if (error) return [];
  return data || [];
};

export const getCitiesByDistrict = async (district) => {
  const { data, error } = await supabase
    .from('active_cities')
    .select('*')
    .eq('district', district)
    .eq('is_active', true);

  if (error) return [];
  return data || [];
};

export const isCityActive = async (cityName, district) => {
  const { data, error } = await supabase
    .from('active_cities')
    .select('is_active')
    .eq('city_name', cityName)
    .eq('district', district)
    .single();

  if (error) return false;
  return data?.is_active || false;
};