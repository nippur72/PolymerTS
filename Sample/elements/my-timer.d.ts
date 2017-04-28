declare class MyTimer extends polymer.Base {
    start: number;
    count: number;
    private timerHandle;
    firm: string;
    ready(): void;
    detatched(): void;
}
