import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SEO from '../utils/SEO.jsx';
import PropTypes from 'prop-types';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import BlogCard from '../components/BlogCard.jsx';

const Blog = () => {
