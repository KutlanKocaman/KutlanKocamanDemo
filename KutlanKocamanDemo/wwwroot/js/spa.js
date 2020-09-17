import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Route } from 'react-router';
import { Layout } from './components/layout';
import WordSearch from './components/algorithms/word-search.js';
import { TopologicalSort } from './components/algorithms/topological-sort';

export default class App extends Component {
    static displayName = App.name;

    render() {
        return (
            <Layout>
                <Route exact path='/' component={WordSearch} />
                <Route path='/WordSearch' component={WordSearch} />
                <Route path='/TopologicalSort' component={TopologicalSort} />
            </Layout>
        );
    }
}

const rootElement = document.getElementById('root');

ReactDOM.render(
    <BrowserRouter basename='/SPA'>
        <App />
    </BrowserRouter>,
    rootElement);
