import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function copyAccessCode(code: string): Promise<void> {
    const copied = await Clipboard.setStringAsync(code);
    if (!copied) throw new Error('Impossible de copier le code dans le presse-papiers.');
}

export async function downloadAccessCode(code: string): Promise<void> {
    const contents = `Code d’accès Zone de Papy\n\n${code}\n\nConservez ce code jusqu’à son expiration.`;
    const fileName = 'code-acces-zone-de-papy.txt';

    if (Platform.OS === 'web') {
        const fileUrl = URL.createObjectURL(new Blob([contents], { type: 'text/plain;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
        return;
    }

    if (!FileSystem.cacheDirectory) {
        throw new Error('Le stockage temporaire est indisponible sur cet appareil.');
    }

    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, contents);
    if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Le partage de fichier est indisponible sur cet appareil.');
    }

    await Sharing.shareAsync(fileUri, {
        dialogTitle: 'Enregistrer votre code d’accès',
        mimeType: 'text/plain',
    });
}
