import { Exercise } from './exercise.model';
import { Subject, Subscription } from 'rxjs';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import { UiService } from '../shared/ui.service';

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
        private uiService: UiService
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
                this.uiService.loadingStateChanged.next(false);
                this.avaliableExercises = exercises;
                this.exercisesChange.next([...this.avaliableExercises]);
            }, err => {
                this.uiService.loadingStateChanged.next(false);
                this.uiService.showSnackbar('Fetching exercises failed, please try again later', null, 3000);
                this.exercisesChange.next(null);
            }));
    }

    startExercise(selectedId: string) {
        this.runningExercise = this.avaliableExercises.find(ex => ex.id === selectedId);
        this.exerciseChange.next({ ...this.runningExercise });
    }

    completeExercise() {
        this.addDataToDb({ ...this.runningExercise, date: new Date(), state: 'completed' });
        this.runningExercise = null;
        this.exerciseChange.next(null);
    }

    cancelExercise(progress: number) {
        this.addDataToDb({
            ...this.runningExercise,
            duration: this.runningExercise.duration * (progress / 100),
            calories: this.runningExercise.calories * (progress / 100),
            date: new Date(),
            state: 'cancelled'
        });
        this.runningExercise = null;
        this.exerciseChange.next(null);
    }

    getRunningExercise() {
        return { ...this.runningExercise };
    }

    fetchCompletedOrCancelledExercises() {
        this.fbSubs.push(this.db
            .collection('finishedExercises')
            .valueChanges()
            .subscribe((ex: Exercise[]) => {
                this.finishedExercisesChanged.next(ex);
            }, error => {
                console.log(error);
            }));
    }

    cancelSubscriptions() {
        this.fbSubs.forEach(sub => sub.unsubscribe());
    }

    private addDataToDb(exercise: Exercise) {
        this.db.collection('finishedExercises').add(exercise);
    }
}
