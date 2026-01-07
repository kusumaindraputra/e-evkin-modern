import { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Result } from 'antd';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Result
                        status="500"
                        title="Terjadi Kesalahan"
                        subTitle="Maaf, terjadi kesalahan saat memuat halaman ini."
                        extra={
                            <Button type="primary" onClick={() => window.location.reload()}>
                                Muat Ulang Halaman
                            </Button>
                        }
                    />
                </div>
            );
        }

        return this.props.children;
    }
}
