"use client";
import React, { useEffect } from 'react';

const SEOMetadata = ({ title, description, url, schema }) => {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  return null;
};

export default SEOMetadata;
