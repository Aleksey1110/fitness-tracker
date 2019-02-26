import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';

@Injectable()
export class UiService {

    constructor(private snackBar: MatSnackBar) { }

    loadingStateChanged = new Subject<boolean>();

    showSnackbar(message, action, duration) {
        this.snackBar.open(message, action, { duration });
    }
}
