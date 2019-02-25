import { Exercise } from './exercise.model';
import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';

@Injectable()
export class TrainingService {
    exerciseChange = new Subject<Exercise>();
    exercisesChange = new Subject<Exercise[]>();
    finishedExercisesChanged = new Subject<Exercise[]>();
    private avaliableExercises: Exercise[] = [];
    private runningExercise: Exercise;


    constructor(
        private db: AngularFirestore,
        private auth: AngularFireAuth
        ) { }

    fetchAvailableExercises() {
        this.db
            .collection('avaliableExercises')
            .snapshotChanges()
            .pipe(map(docArray => {
                return docArray.map(doc => {
                    return {
                        id: doc.payload.doc.id,
                        // name: doc.payload.doc.data().name,
                        // duration: doc.payload.doc.data().duration,
                        // calories: doc.payload.doc.data().calories
                        ...doc.payload.doc.data()
                    };
                });
            }))
            .subscribe((exercises: Exercise[]) => {
                this.avaliableExercises = exercises;
                this.exercisesChange.next([...this.avaliableExercises]);
            });
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
        this.db
            .collection('finishedExercises')
            .valueChanges()
            .subscribe((ex: Exercise[]) => {
                this.finishedExercisesChanged.next(ex);
            });
    }

    private addDataToDb(exercise: Exercise) {
        this.db.collection('finishedExercises').add(exercise);
    }
}
