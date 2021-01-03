import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../components/user-context';
import { submitFormWithRequestVerificationToken } from '../shared/functions';

export class Layout extends Component {
    constructor(props) {
        super(props);

        this.state = {
            authenticated: false,
            userName: null,
            updateAuthenticated: this.updateAuthenticated
        }
    }
    static displayName = Layout.name;

    componentDidMount() {
        this.updateAuthenticated();
    }

    updateAuthenticated = () => {
        fetch(new Request('/api/Auth'))
            .then((response) => {
                const responseJSON = response.json();
                responseJSON.then(data => {
                    this.setState({
                        authenticated: data.authenticated,
                        userName: data.userName
                    });
                });
            });
    }

    getLogoutActionUrl = () => {
        return `/Identity/Account/Logout?returnUrl=${encodeURI(window.location.pathname)}`;
    }

    renderLoginPartial = () => {
        if (this.state.authenticated === true) {
            return (
                <div className="btn-group navbar-nav">
                    <a href="#" type="button" className="nav-link text-dark" id="contentForAuthUsersButton" data-toggle="dropdown">
                        {this.state.userName}
                    </a>
                    <div className="dropdown-menu" aria-labelledby="contentForAuthUsersButton">
                        <a className="nav-link text-dark" href="/Identity/Account/Manage/Index" title="Manage">Account & Security</a>
                        <form id="logoutForm" className="form-inline" action={this.getLogoutActionUrl()} method="post" />
                        <a
                            className="nav-link text-dark"
                            onClick={() => { submitFormWithRequestVerificationToken("logoutForm", document.querySelector("input[name=\"__RequestVerificationToken\"]").value); }}
                            href="#"
                        >Logout</a>
                    </div>
                </div>
            );
        }

        return (
            <div className="btn-group navbar-nav">
                <a className="nav-link text-dark" href="/Identity/Account/Login">Login</a>
            </div>
        );
    }

    render() {
        return (
            <UserContext.Provider value={this.state}>
                <div>
                    <header>
                        <nav className="navbar navbar-expand-sm navbar-toggleable-sm navbar-light bg-white border-bottom box-shadow mb-3">
                            <div className="container">
                                <a className="navbar-nav" href="/Home/Index">
                                    <img className="navbar-logo" src="/Images/KutlanCoder.svg" />
                                </a>
                                <div className="navbar-right-pad"></div>
                                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target=".navbar-collapse" aria-controls="navbarSupportedContent"
                                    aria-expanded="false" aria-label="Toggle navigation">
                                    <span className="navbar-toggler-icon"></span>
                                </button>
                                <div className="navbar-collapse collapse d-sm-inline-flex flex-sm-row">
                                    <div className="btn-group navbar-nav">
                                        <a href="#" type="button" className="nav-link text-dark" id="algorithmsButton" data-toggle="dropdown">
                                            Algorithms
                                        </a>
                                        <div className="dropdown-menu" aria-labelledby="algorithmsButton">
                                            <Link className="nav-link text-dark" to="/KnuthMorrisPratt">KMP String Search</Link>
                                            <Link className="nav-link text-dark" to="/TopologicalSort">Topological Sort</Link>
                                            <Link className="nav-link text-dark" to="/WordSearch">Word Search</Link>
                                        </div>
                                    </div>
                                    <div className="btn-group navbar-nav ml-auto">
                                        <a className="nav-link text-dark navbar-nav" href="/Home/About">About</a>
                                    </div>
                                    {this.renderLoginPartial()}
                                </div>
                            </div>
                        </nav>
                    </header>
                    <div className="container">
                        <main role="main" className="pb-3">
                            {this.props.children}
                        </main>
                    </div>
                </div>
            </UserContext.Provider>
        );
    }
}
