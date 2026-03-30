// screens/MyCrops/utils/constants.js
import React from 'react';

// Import all crop images
import cerealsImage from '../CropImages/Cereals.jpeg';
import vegetablesImage from '../CropImages/Vegetables.jpeg';
import fruitsImage from '../CropImages/fruits.jpeg';
import legumesImage from '../CropImages/Legumes.jpeg';
import rootCropsImage from '../CropImages/Root_Crops.jpeg';
import oilseedsImage from '../CropImages/Oilseeds.png';
import fiberCropsImage from '../CropImages/Fiber.png';
import sugarCropsImage from '../CropImages/Sugar.jpeg';
import forageCropsImage from '../CropImages/Forage.png';
import herbsSpicesImage from '../CropImages/Basil.jpeg';

export const CROP_TYPES = {
  CEREALS: {
    id: 'cereals',
    name: 'Cereals',
    icon: 'grain',
    color: '#F59E0B',
    description: 'Wheat, Rice, Maize, Barley, Oats',
    examples: ['Wheat', 'Rice', 'Maize'],
    image: cerealsImage
  },
  VEGETABLES: {
    id: 'vegetables',
    name: 'Vegetables',
    icon: 'carrot',
    color: '#10B981',
    description: 'Tomatoes, Lettuce, Cabbage, etc.',
    examples: ['Tomato', 'Potato', 'Onion'],
    image: vegetablesImage
  },
  FRUITS: {
    id: 'fruits',
    name: 'Fruits',
    icon: 'fruit-cherries',
    color: '#EF4444',
    description: 'Apples, Oranges, Grapes, etc.',
    examples: ['Apple', 'Orange', 'Grape'],
    image: fruitsImage
  },
  LEGUMES: {
    id: 'legumes',
    name: 'Legumes',
    icon: 'soy-sauce',
    color: '#8B5CF6',
    description: 'Beans, Peas, Lentils, Soybeans',
    examples: ['Soybeans', 'Beans', 'Peas'],
    image: legumesImage
  },
  ROOT_CROPS: {
    id: 'root_crops',
    name: 'Root Crops',
    icon: 'sprout',
    color: '#F97316',
    description: 'Potatoes, Cassava, Sweet Potato',
    examples: ['Potato', 'Sweet Potato', 'Cassava'],
    image: rootCropsImage
  },
  OILSEEDS: {
    id: 'oilseeds',
    name: 'Oilseeds',
    icon: 'seed',
    color: '#FBBF24',
    description: 'Sunflower, Canola, Sesame',
    examples: ['Sunflower', 'Canola', 'Sesame'],
    image: oilseedsImage
  },
  FIBER_CROPS: {
    id: 'fiber_crops',
    name: 'Fiber Crops',
    icon: 'flower',
    color: '#06B6D4',
    description: 'Cotton, Flax, Hemp',
    examples: ['Cotton', 'Flax', 'Hemp'],
    image: fiberCropsImage
  },
  SUGAR_CROPS: {
    id: 'sugar_crops',
    name: 'Sugar Crops',
    icon: 'cube',
    color: '#EC4899',
    description: 'Sugarcane, Sugar Beet',
    examples: ['Sugarcane', 'Sugar Beet'],
    image: sugarCropsImage
  },
  FORAGE_CROPS: {
    id: 'forage_crops',
    name: 'Forage Crops',
    icon: 'grass',
    color: '#84CC16',
    description: 'Alfalfa, Clover, Hay',
    examples: ['Alfalfa', 'Clover', 'Hay'],
    image: forageCropsImage
  },
  HERBS_SPICES: {
    id: 'herbs_spices',
    name: 'Herbs & Spices',
    icon: 'leaf',
    color: '#22C55E',
    description: 'Basil, Mint, Coriander, etc.',
    examples: ['Basil', 'Mint', 'Coriander'],
    image: herbsSpicesImage
  }
};

export const GROWTH_STAGES = {
  GERMINATION: 'Germination (0-20%)',
  VEGETATIVE: 'Vegetative (20-40%)',
  FLOWERING: 'Flowering (40-60%)',
  FRUITING: 'Fruiting/Grain Fill (60-80%)',
  MATURATION: 'Maturation (80-100%)',
  HARVEST: 'Ready to Harvest (100%)'
};

export const FILTER_OPTIONS = {
  ALL: 'all',
  BY_FARM: 'by_farm',
  BY_TYPE: 'by_type',
  BY_STAGE: 'by_stage'
};

export const SORT_OPTIONS = {
  NAME: 'name',
  PLANT_DATE: 'plant_date',
  AREA: 'area',
  GROWTH: 'growth'
};

export const STORAGE_KEYS = {
  CROPS_DATA: '@user_crops',
  SYNC_QUEUE: '@crops_sync_queue'
};

// Helper to get all crop type examples
export const getAllCropExamples = () => {
  const allExamples = [];
  Object.values(CROP_TYPES).forEach(type => {
    type.examples.forEach(example => {
      allExamples.push({
        name: example,
        type: type.id,
        typeName: type.name,
        color: type.color
      });
    });
  });
  return allExamples;
};