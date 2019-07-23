// 声明资源文件类型
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';
declare module '*.html';
declare module '*.txt';
declare module '*.htm';
declare module '*.css';
declare module '*.scss';
declare module '*.less';

/**
 * process.env.XX
 */
declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: string;
        BASE_NAME: string;
        PUBLIC_URL: string;
    }
}

/**
 * From T delete a set of properties P
 */
type Omit<T, P> = Pick<T, Exclude<keyof T, P>>;

/**
 * create HOC(Higher Order Component)
 *
 */
type HOC<InjectProps> = <SelfProps>(
    Component: React.ComponentType<SelfProps & InjectProps>
) => React.ComponentType<Omit<SelfProps, keyof InjectProps>>;
