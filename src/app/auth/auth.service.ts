import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { AuthData } from './auth-data.model';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { TrainingService } from '../training/training.service';
import { UiService } from '../shared/ui.service';

@Injectable()
export class AuthService {
    authChange = new Subject<boolean>();
    private isAuthenticated = false;

    constructor(private router: Router,
        private afAuth: AngularFireAuth,
        private trainingService: TrainingService,
        private uiServise: UiService
    ) { }

    initAuthListener() {
        this.afAuth.authState.subscribe(user => {
            if (user) {
                this.isAuthenticated = true;
                this.authChange.next(true);
                this.router.navigate(['/training']);
            } else {
                this.trainingService.cancelSubscriptions();
                this.isAuthenticated = false;
                this.authChange.next(false);
                this.router.navigate(['/login']);
            }
        });
    }

    registerUser(authData: AuthData) {
        this.uiServise.loadingStateChanged.next(true);
        this.afAuth
            .auth
            .createUserWithEmailAndPassword(authData.email, authData.password)
            .then(result => {
                this.uiServise.loadingStateChanged.next(false);
            })
            .catch(err => {
                this.uiServise.loadingStateChanged.next(false);
                this.uiServise.showSnackbar(err.message, null, 3000);
            });
    }

    login(authData: AuthData) {
        this.uiServise.loadingStateChanged.next(true);
        this.afAuth
            .auth
            .signInWithEmailAndPassword(authData.email, authData.password)
            .then(result => {
                this.uiServise.loadingStateChanged.next(false);
            })
            .catch(err => {
                this.uiServise.loadingStateChanged.next(false);
                this.uiServise.showSnackbar(err.message, null, 3000);
            });
    }

    logout() {
        this.afAuth.auth.signOut();
    }

    isAuth() {
        return this.isAuthenticated;
    }

}
