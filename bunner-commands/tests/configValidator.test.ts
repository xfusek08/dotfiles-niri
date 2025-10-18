import { describe, test, expect } from 'bun:test';
import { validateAppConfig } from '../lib/utils/configValidator';
import { ConfigValidationError } from '../lib/utils/types';
import type { AppConfig } from '../lib/utils/app_manager';

describe('configValidator', () => {
    const createValidConfig = (): AppConfig => ({
        id: 'test-app',
        name: 'Test App',
        repository: 'owner/repo',
        assetPattern: 'linux-x86_64.tar.gz',
        paths: {
            mainDirectory: '$HOME/.test-app',
            installDirectory: '$HOME/.test-app/app',
            executableLink: '$HOME/.local/bin/test-app',
            executableTarget: '$HOME/.test-app/app/test-app',
            desktopFile: '$HOME/.local/share/applications/test-app.desktop',
            iconPath: '$HOME/.test-app/app/icon.png',
            cacheDirectories: ['$HOME/.cache/test-app'],
            profileDirectories: ['$HOME/.test-app/profile'],
        },
        backup: {
            defaultBaseName: 'test-app-backup',
            preInstallBackupName: 'test-app-backup-before-install',
            environmentVariable: 'BACKUP_DIR',
            excludePatterns: ['*.tmp', '*.log'],
            includeAllSuffix: 'complete',
        },
        desktopEntry: {
            version: '1.0',
            name: 'Test App',
            comment: 'A test application',
            genericName: 'Test Application',
            keywords: ['test', 'app'],
            exec: '$HOME/.local/bin/test-app',
            terminal: false,
            type: 'Application',
            icon: '$HOME/.test-app/app/icon.png',
            categories: ['Utility'],
            mimeType: ['text/plain'],
            startupNotify: true,
        },
    });

    describe('valid configurations', () => {
        test('should not throw for valid configuration', () => {
            const config = createValidConfig();
            expect(() => validateAppConfig(config)).not.toThrow();
        });

        test('should accept minimal optional fields', () => {
            const config = createValidConfig();
            config.backup.environmentVariable = undefined;
            config.backup.includeAllSuffix = undefined;
            config.desktopEntry.additionalFields = undefined;
            expect(() => validateAppConfig(config)).not.toThrow();
        });
    });

    describe('id validation', () => {
        test('should throw for empty id', () => {
            const config = createValidConfig();
            config.id = '';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
            expect(() => validateAppConfig(config)).toThrow(/App ID cannot be empty/);
        });

        test('should throw for whitespace-only id', () => {
            const config = createValidConfig();
            config.id = '   ';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
        });
    });

    describe('name validation', () => {
        test('should throw for empty name', () => {
            const config = createValidConfig();
            config.name = '';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
            expect(() => validateAppConfig(config)).toThrow(/App name cannot be empty/);
        });

        test('should throw for whitespace-only name', () => {
            const config = createValidConfig();
            config.name = '\t\n  ';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
        });
    });

    describe('repository validation', () => {
        test('should throw for empty repository', () => {
            const config = createValidConfig();
            config.repository = '';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
            expect(() => validateAppConfig(config)).toThrow(/Repository must be in format/);
        });

        test('should throw for repository without slash', () => {
            const config = createValidConfig();
            config.repository = 'invalid-repo';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
            expect(() => validateAppConfig(config)).toThrow(/owner\/repo/);
        });

        test('should throw for repository with empty owner', () => {
            const config = createValidConfig();
            config.repository = '/repo';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
        });

        test('should throw for repository with empty repo name', () => {
            const config = createValidConfig();
            config.repository = 'owner/';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
        });

        test('should throw for repository with multiple slashes', () => {
            const config = createValidConfig();
            config.repository = 'owner/repo/extra';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
        });

        test('should accept valid repository format', () => {
            const config = createValidConfig();
            config.repository = 'valid-owner/valid-repo';
            expect(() => validateAppConfig(config)).not.toThrow();
        });
    });

    describe('assetPattern validation', () => {
        test('should throw for empty assetPattern', () => {
            const config = createValidConfig();
            config.assetPattern = '';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
            expect(() => validateAppConfig(config)).toThrow(/Asset pattern cannot be empty/);
        });

        test('should throw for whitespace-only assetPattern', () => {
            const config = createValidConfig();
            config.assetPattern = '  ';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
        });
    });

    describe('paths validation', () => {
        test('should throw for empty mainDirectory', () => {
            const config = createValidConfig();
            config.paths.mainDirectory = '';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
            expect(() => validateAppConfig(config)).toThrow(/Main directory path cannot be empty/);
        });

        test('should throw for empty installDirectory', () => {
            const config = createValidConfig();
            config.paths.installDirectory = '';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
            expect(() => validateAppConfig(config)).toThrow(
                /Install directory path cannot be empty/,
            );
        });

        test('should throw for empty executableLink', () => {
            const config = createValidConfig();
            config.paths.executableLink = '';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
            expect(() => validateAppConfig(config)).toThrow(/Executable link path cannot be empty/);
        });

        test('should throw for empty executableTarget', () => {
            const config = createValidConfig();
            config.paths.executableTarget = '';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
            expect(() => validateAppConfig(config)).toThrow(
                /Executable target path cannot be empty/,
            );
        });

        test('should throw for empty desktopFile', () => {
            const config = createValidConfig();
            config.paths.desktopFile = '';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
            expect(() => validateAppConfig(config)).toThrow(/Desktop file path cannot be empty/);
        });

        test('should throw for empty iconPath', () => {
            const config = createValidConfig();
            config.paths.iconPath = '';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
            expect(() => validateAppConfig(config)).toThrow(/Icon path cannot be empty/);
        });
    });

    describe('backup validation', () => {
        test('should throw for empty defaultBaseName', () => {
            const config = createValidConfig();
            config.backup.defaultBaseName = '';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
            expect(() => validateAppConfig(config)).toThrow(
                /Default backup base name cannot be empty/,
            );
        });

        test('should throw for whitespace-only defaultBaseName', () => {
            const config = createValidConfig();
            config.backup.defaultBaseName = '   ';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
        });

        test('should throw for empty preInstallBackupName', () => {
            const config = createValidConfig();
            config.backup.preInstallBackupName = '';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
            expect(() => validateAppConfig(config)).toThrow(
                /Pre-install backup name cannot be empty/,
            );
        });

        test('should throw for whitespace-only preInstallBackupName', () => {
            const config = createValidConfig();
            config.backup.preInstallBackupName = '  \t  ';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
        });
    });

    describe('desktopEntry validation', () => {
        test('should throw for empty desktop entry name', () => {
            const config = createValidConfig();
            config.desktopEntry.name = '';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
            expect(() => validateAppConfig(config)).toThrow(/Desktop entry name cannot be empty/);
        });

        test('should throw for whitespace-only desktop entry name', () => {
            const config = createValidConfig();
            config.desktopEntry.name = '   ';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
        });

        test('should throw for empty desktop entry exec', () => {
            const config = createValidConfig();
            config.desktopEntry.exec = '';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
            expect(() => validateAppConfig(config)).toThrow(/Desktop entry exec cannot be empty/);
        });

        test('should throw for whitespace-only desktop entry exec', () => {
            const config = createValidConfig();
            config.desktopEntry.exec = '\n\t  ';
            expect(() => validateAppConfig(config)).toThrow(ConfigValidationError);
        });
    });

    describe('ConfigValidationError details', () => {
        function expectConfigValidationError(config: AppConfig, expectedField: string) {
            try {
                validateAppConfig(config);
                expect(true).toBe(false); // Should not reach here
            } catch (error) {
                expect(error).toBeInstanceOf(ConfigValidationError);
                if (error instanceof ConfigValidationError) {
                    expect(error.field).toBe(expectedField);
                }
            }
        }

        test('should include field name in error', () => {
            const config = createValidConfig();
            config.id = '';
            expectConfigValidationError(config, 'id');
        });

        test('should include nested field path for paths', () => {
            const config = createValidConfig();
            config.paths.mainDirectory = '';
            expectConfigValidationError(config, 'paths.mainDirectory');
        });

        test('should include nested field path for backup', () => {
            const config = createValidConfig();
            config.backup.defaultBaseName = '';
            expectConfigValidationError(config, 'backup.defaultBaseName');
        });
    });
});
