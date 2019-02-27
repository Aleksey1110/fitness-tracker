import { Exercise } from './exercise.model';
import { Subject, Subscription } from 'rxjs';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { map, take } from 'rxjs/operators';
import { UiService } from '../shared/ui.service';
import { Store } from '@ngrx/store';
import * as fromTraining from '../training/training.reducer';
import * as UI from '../shared/ui.actions';
import * as Training from '../training/training.actions';

@Injectable()
export class TrainingService {
    exerciseChange = new Subject<Exercise>();
    exercisesChange = new Subject<Exercise[]>();
    finishedExercisesChanged = new Subject<Exercise[]>();
    private avaliableExercises: Exercise[] = [];
    private runningExercise: Exercise;
    private fbSubs: Subscription[] = [];


    constructor(
        private db: AngularFirestore,
        private uiService: UiService,
        private store: Store<fromTraining.State>
    ) { }

    fetchAvailableExercises() {
        this.fbSubs.push(this.db
            .collection('avaliableExercises')
            .snapshotChanges()
            .pipe(map(docArray => {
                return docArray.map(doc => {
                    return {
                        id: doc.payload.doc.id,
                        ...doc.payload.doc.data()
                    };
                });
            }))
            .subscribe((exercises: Exercise[]) => {
                this.store.dispatch(new UI.StopLoading);
                this.store.dispatch(new Training.SetAvailableTrainings(exercises));
            }, err => {
                this.store.dispatch(new UI.StopLoading);
                this.uiService.showSnackbar('Fetching exercises failed, please try again later', null, 3000);
                this.exercisesChange.next(null);
            }));
    }

    startExercise(selectedId: string) {
        this.store.dispatch(new Training.StartTraining(selectedId));
    }

    completeExercise() {
        this.store.select(fromTraining.getActiveTraining).pipe(take(1)).subscribe(ex => {
            this.addDataToDb({ ...ex, date: new Date(), state: 'completed' });
            this.store.dispatch(new Training.StopTraining());
        });

    }

    cancelExercise(progress: number) {
        this.store.select(fromTraining.getActiveTraining).pipe(take(1)).subscribe(ex => {
            this.addDataToDb({
                ...ex,
                date: new Date(),
                state: 'completed',
                duration: ex.duration * (progress / 100),
                calories: ex.calories * (progress / 100),
            });
            this.store.dispatch(new Training.StopTraining());
        });
    }

    fetchCompletedOrCancelledExercises() {
        this.fbSubs.push(this.db
            .collection('finishedExercises')
            .valueChanges()
            .subscribe((ex: Exercise[]) => {
                this.store.dispatch(new Training.SetFinishedTrainings(ex));
            }));
    }

    cancelSubscriptions() {
        this.fbSubs.forEach(sub => sub.unsubscribe());
    }

    private addDataToDb(exercise: Exercise) {
        this.db.collection('finishedExercises').add(exercise);
    }
}
