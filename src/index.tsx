/*
**
** Copyright (C) 1991 by Jef Poskanzer
**
** Permission to use, copy, modify, and distribute this software and its
** documentation for any purpose and without fee is hereby granted, provided
** that the above copyright notice appear in all copies and that both that
** copyright notice and this permission notice appear in supporting
** documentation.  This software is provided "as is" without express or
** implied warranty.
*/
// Original '91 source code ported to React (badly) by Sean Anderson in '22!

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// TODO: idk if this is good practice or not. docs keep implying it is, but it seems awkward to preload resources
// surely browser handles this just fine
import { Loader } from 'pixi.js';
import antImage from './ant.png';
import { createTheme, ThemeProvider } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#ffffff',
    },
    mode: 'dark',
  },
});

Loader.shared.add('Ant', antImage, () => {
  ReactDOM.render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </React.StrictMode>,
    document.getElementById('root')
  );
});
Loader.shared.load();


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
