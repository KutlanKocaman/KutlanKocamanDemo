import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Route } from 'react-router';
import { Layout } from './components/layout';
import { KnuthMorrisPratt } from './components/algorithms/knuth-morris-pratt';
import { TopologicalSort } from './components/algorithms/topological-sort';
import WordSearch from './components/algorithms/word-search.js';
import Analytics from 'react-router-ga';

export default class App extends Component {
    static displayName = App.name;

    render() {
        return (
            <BrowserRouter basename='/SPA'>
                <Analytics basename='/SPA' id='UA-179585462-1'>
                    <Layout>
                        <Route exact path='/' component={WordSearch} />
                        <Route path='/KnuthMorrisPratt' component={KnuthMorrisPratt} />
                        <Route path='/TopologicalSort' component={TopologicalSort} />
                        <Route path='/WordSearch' component={WordSearch} />
                    </Layout>
                </Analytics>
            </BrowserRouter>
        );
    }
}

const rootElement = document.getElementById('root');

ReactDOM.render(
        <App />,
    rootElement);
