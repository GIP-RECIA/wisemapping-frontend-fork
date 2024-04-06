// import './wdyr';

import React from 'react';
import App from './app';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root') as HTMLElement;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);
root.render(<App />);
