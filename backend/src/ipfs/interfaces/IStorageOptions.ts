export interface IStorageOptions {
    readonly content:
        | Buffer
        | Uint8Array
        | string;

    readonly fileName: string;

    readonly mimeType: string;

    readonly uploadedAt?: Date | string;

    /**
     * Pin the object immediately after upload.
     * Defaults to true in StorageService.
     */
    readonly pin?: boolean;
}