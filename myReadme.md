# 说明
Run Demo Locally
----------------

.. code:: bash
    
    cd demo_app
    ./manage.py migrate
    #./manage.py dumpdata > data.json
    #python manage.py inspectdb > models.py
    #python manage.py inspectdb > models.py --database 'databasename'
    ./manage.py loaddata data.json
    ./manage.py createsuperuser #如果用户名密码不对，重新创建用户
    ./manage.py runserver
