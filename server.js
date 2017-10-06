const path = require('path');
const express = require('express');
const bodyPerser = require('body-parser');
const methodOverride = require('method-override')
const app = express();
const MongoClient = require('mongodb').MongoClient;

let db;
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

MongoClient.connect(`mongodb://${dbUser}:${dbPassword}@${dbName}`, (err, database) => {
  if (err) {
    return console.log(err);
  }
  db = database;

  // テンプレートエンジン（pug）を指定する
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug');

  // override with POST having ?_method=PUT
  app.use(methodOverride('_method'));

  // Expressのミドルウェアであるbody-parserを利用する
  // urlencodedメソッドは、<form>要素からデータを抽出し、requestオブジェクトのbodyプロパティに追加する
  app.use(bodyPerser.urlencoded({ extended: true }));

  app.listen(3000, () => {
    console.log('listening on 3000');
  });

  app.get('/', (req, res) => {
    db.collection('quotes').find().toArray((err, results) => {
      res.render('index', { quotes: results });
    });
  });

  app.post('/quotes', (req, res) => {
    const collection = db.collection('quotes');
    // body-parserのurlencodedメソッドを指定しているため
    // <form>要素から抽出したデータがbodyプロパティに追加されている
    // このデータをcollectionにsaveする
    collection.save(req.body, (err, result) => {
      if (err) {
        return console.log(err)
      }

      console.log('saved to database');
      res.redirect('/');
    });
  });

  app.put('/quotes', (req, res) => {
    // findOneAndUpdateでdocumentを更新する
    // https://docs.mongodb.com/v3.2/reference/method/db.collection.findOneAndUpdate/
    // findOneAndUpdateはfilter（第二引数）とsort(第三引数)に基づいてdocumentを更新する
    db.collection('quotes')
      .findOneAndUpdate(
        // <filter>
        // 更新の選択基準
        // find（）メソッドと同じクエリセレクタが利用できる
        { name: req.body.name },

        // <update>
        // update operatorsを含める必要がある
        // https://docs.mongodb.com/v3.2/reference/operator/update/
        {
          $set: {
            name: req.body.name,
            quote: req.body.quote,
          }
        },

        {
          sort: { _id: -1 },
          upset: true,
        },

        (err, result) => {
          if (err) {
            return console.log(err)
          }

          console.log('updated to database');
          res.redirect('/');
        }
      );
  });

  app.delete('/quotes', (req, res) => {
    db.collection('quotes')
      .findOneAndDelete({ name: req.body.name }, (err, result) => {
        if (err) return res.send(500, err);
        console.log('deleted to database');
        res.redirect('/');
      });
  });
});
