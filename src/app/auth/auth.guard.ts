import { Router, CanLoad, Route } from '@angular/router';
import { Injectable } from '@angular/core';
import * as fromRoot from '../app.reducer';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';

@Injectable()
export class AuthGuard implements CanLoad {
    constructor(
        private store: Store<fromRoot.State>,
        private router: Router
    ) { }

    canLoad(route: Route) {
        return this.store.select(fromRoot.getIsAuth).pipe(take(1));
    }
}
