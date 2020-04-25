import React, { Component } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { Request, Response } from 'express';
import { RouteItem } from './RouteItem.d';
import prefetchRoutesInitialProps from './prefetchRoutesInitialProps';

declare global {
    interface Window {
        __DATA__: any;
    }
}

export { RouteItem, prefetchRoutesInitialProps };

export type SSRProps<More> = {
    __error__: Error | undefined;
    __loading__: boolean;
    __getData__(extraProps?: {}): Promise<void>;
} & More;

interface SSRInitialParams extends Partial<Omit<RouteComponentProps, 'match'>> {
    match: RouteComponentProps<any>['match'];
    parentInitialProps: any;
    request?: Request;
    response?: Response;
}

let routerChanged = typeof window === 'undefined' || !window.__DATA__ || !!window.__DATA__.__error__;
const onHistoryChange = () => {
    routerChanged = true;

    window.removeEventListener('popstate', onHistoryChange);
    window.removeEventListener('hashchange', onHistoryChange);
};

if (!routerChanged && typeof window !== 'undefined') {
    window.addEventListener('popstate', onHistoryChange);
    window.addEventListener('hashchange', onHistoryChange);
}

function withSSR<SelfProps, More = {}>(
    WrappedComponent: React.ComponentType<SelfProps & SSRProps<More>>,
    getInitialProps: (props: SSRInitialParams) => Promise<More>
) {
    interface SSRState {
        initialProps: More;
        loading: boolean;
        error: any;
    }

    class WithSSR extends Component<Omit<SelfProps, keyof SSRProps<More>>, SSRState> {
        static displayName = `WithSSR.${WrappedComponent.displayName || WrappedComponent.name}`;

        constructor(props) {
            super(props);

            let initialProps = WithSSR.SSRInitialData;

            if (!routerChanged) {
                routerChanged = props.history?.action === 'PUSH';
            }

            this.state = {
                initialProps,
                loading: routerChanged
            } as SSRState;
        }

        componentDidMount() {
            if (routerChanged) {
                this.getInitialProps();
            }
        }

        getInitialProps = async extraProps => {
            try {
                this.setState({
                    loading: true
                });

                // @ts-ignore
                const initialProps = await getInitialProps({ ...this.props, ...extraProps });

                this.setState({
                    initialProps
                });
            } catch (error) {
                if (__DEV__) {
                    console.error(error);
                }

                this.setState({
                    error
                });
            }

            this.setState({
                loading: false
            });
        };

        render() {
            if (WithSSR.SSRInitialData) {
                // @ts-ignore
                return <WrappedComponent {...this.props} {...WithSSR.SSRInitialData} __loading__={false} />;
            }

            const { loading, error, initialProps } = this.state;

            return (
                // @ts-ignore
                <WrappedComponent
                    {...this.props}
                    {...(routerChanged ? {} : window.__DATA__)}
                    {...initialProps}
                    __loading__={loading}
                    __error__={error}
                    __getData__={this.getInitialProps}
                />
            );
        }

        static SSRInitialData: any;
        static getInitialProps = async (...args) => {
            try {
                // @ts-ignore
                const initialProps = await getInitialProps(...args);

                WithSSR.SSRInitialData = initialProps;
            } catch (error) {
                WithSSR.SSRInitialData = {
                    __error__: error
                };
            }

            return WithSSR.SSRInitialData;
        };
    }

    hoistNonReactStatics(WithSSR, WrappedComponent);

    return WithSSR;
}

export default withSSR;
