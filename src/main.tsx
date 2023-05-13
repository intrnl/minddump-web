import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import './style.css';
import App from './App.tsx';

ReactDOM.render(
	<BrowserRouter>
		<App />
	</BrowserRouter>,
	document.getElementById('root'),
);
